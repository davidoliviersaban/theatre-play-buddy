import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, extractTextFromDOCX, extractTextFromTXT } from "../../../../lib/parse/extractors";
import { PlaybookSchema, type Playbook } from "../../../../lib/parse/schemas";
import { streamPlayParsing, getDefaultProvider, parsePlayStructure } from "../../../../lib/parse/llm-parser";
import { parsePlayIncrementally, contextToPlaybook, type ParsingContext } from "../../../../lib/parse/incremental-parser";
import { savePlay } from "../../../../lib/db/plays-db-prisma";
import { createParseJob, updateParseJob, deleteCompletedJobs } from "../../../../lib/db/parse-job-db";
import { buildSessionUpdate } from "../../../../lib/parse/session-runner";
import { JobQueue } from "../../../../jobs/parse/queue";
import type { DeepPartial } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Threshold for using incremental parsing (characters)
// Plays longer than this will be parsed in chunks to avoid timeouts
const INCREMENTAL_PARSE_THRESHOLD = 20000;

let __sseClosed = false;

function sseHeaders() {
    return new Headers({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    });
}

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
    if (__sseClosed) return;
    try {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
        __sseClosed = true;
        try { controller.close(); } catch { }
    }
}

function calculateProgress(linesCompleted: number, estimatedTokens: number): number {
    return Math.min(Math.round(linesCompleted / estimatedTokens * 100), 100);
}

function countCurrentLines(partial: DeepPartial<Playbook>): number {
    return partial.acts?.reduce((total, act) =>
        total + (act?.scenes?.reduce((sceneTotal, scene) =>
            sceneTotal + (scene?.lines?.length || 0), 0) || 0), 0) || 0;
}

function emitCharacterEvents(
    partial: DeepPartial<Playbook>,
    charactersSeen: Set<string>,
    controller: ReadableStreamDefaultController
) {
    if (!partial.characters) return;

    for (const char of partial.characters) {
        if (char && char.id && !charactersSeen.has(char.id)) {
            charactersSeen.add(char.id);
            sendEvent(controller, "character_found", { id: char.id, name: char.name });
        }
    }
}

function emitActEvents(
    partial: DeepPartial<Playbook>,
    actsSeen: number,
    controller: ReadableStreamDefaultController
): number {
    if (!partial.acts || partial.acts.length <= actsSeen) return actsSeen;

    let newActsSeen = actsSeen;
    for (let i = actsSeen; i < partial.acts.length; i++) {
        const act = partial.acts[i];
        if (act && act.id) {
            sendEvent(controller, "act_complete", { id: act.id, title: act.title });
            newActsSeen++;
        }
    }
    return newActsSeen;
}

function emitSceneEvents(
    partial: DeepPartial<Playbook>,
    scenesSeen: number,
    controller: ReadableStreamDefaultController
): number {
    if (!partial.acts) return scenesSeen;

    const totalScenes = partial.acts.reduce((sum: number, act) =>
        sum + (act?.scenes?.length || 0), 0);

    if (totalScenes <= scenesSeen) return scenesSeen;

    let newScenesSeen = scenesSeen;
    for (const act of partial.acts) {
        if (act && act.scenes) {
            for (const scene of act.scenes) {
                if (scene && scene.id && newScenesSeen < totalScenes) {
                    sendEvent(controller, "scene_complete", { id: scene.id, title: scene.title });
                    newScenesSeen++;
                }
            }
        }
    }
    return newScenesSeen;
}

/**
 * Fix character ID mismatches by matching lowercase characterId against actual character list
 * Replaces incorrect characterIds with the correct ones from the playbook
 */
function fixCharacterIdMismatches(playbook: DeepPartial<Playbook>): DeepPartial<Playbook> {
    if (!playbook.characters || !playbook.acts) return playbook;

    // Build a map of lowercase character IDs to actual character IDs
    const charIdMap = new Map<string, string>();
    for (const char of playbook.characters) {
        if (char?.id) {
            charIdMap.set(char.id.toLowerCase(), char.id);
        }
    }

    let fixedCount = 0;

    // Iterate through all lines and fix character IDs
    for (const act of playbook.acts) {
        if (!act?.scenes) continue;

        for (const scene of act.scenes) {
            if (!scene?.lines) continue;

            for (const line of scene.lines) {
                if (!line) continue;

                // Fix single characterId
                if (line.characterId) {
                    const correctId = charIdMap.get(line.characterId.toLowerCase());
                    if (correctId && correctId !== line.characterId) {
                        console.log(`[Char Fix] Replacing "${line.characterId}" → "${correctId}"`);
                        line.characterId = correctId;
                        fixedCount++;
                    }
                }

                // Fix characterIdArray
                if (line.characterIdArray && Array.isArray(line.characterIdArray)) {
                    for (let i = 0; i < line.characterIdArray.length; i++) {
                        const charId = line.characterIdArray[i];
                        if (charId) {
                            const correctId = charIdMap.get(charId.toLowerCase());
                            if (correctId && correctId !== charId) {
                                console.log(`[Char Fix] Replacing "${charId}" → "${correctId}" in array`);
                                line.characterIdArray[i] = correctId;
                                fixedCount++;
                            }
                        }
                    }
                }
            }
        }
    }

    if (fixedCount > 0) {
        console.log(`[Char Fix] Fixed ${fixedCount} character ID mismatches`);
    }

    return playbook;
}

/**
 * Clean up playbook data to ensure validation passes
 * Handles edge cases where LLM produces invalid data
 */
function cleanupPlaybook(playbook: DeepPartial<Playbook>): DeepPartial<Playbook> {
    if (!playbook.acts || !playbook.characters) return playbook;

    // Build valid character ID set
    const validCharIds = new Set<string>();
    for (const char of playbook.characters) {
        if (char?.id) validCharIds.add(char.id);
    }

    let fixedDialogueCount = 0;
    let removedLinesCount = 0;

    for (const act of playbook.acts) {
        if (!act?.scenes) continue;

        for (const scene of act.scenes) {
            if (!scene?.lines) continue;

            // Filter and fix lines
            scene.lines = scene.lines.filter(line => {
                if (!line) {
                    removedLinesCount++;
                    return false;
                }

                // Remove lines without text
                if (!line.text || line.text.trim().length === 0) {
                    removedLinesCount++;
                    return false;
                }

                // If dialogue without valid character attribution, convert to stage direction
                if (line.type === "dialogue") {
                    const hasValidSingleChar = line.characterId && validCharIds.has(line.characterId);
                    const hasValidArrayChars = line.characterIdArray &&
                        Array.isArray(line.characterIdArray) &&
                        line.characterIdArray.length > 0 &&
                        line.characterIdArray.some(id => id && validCharIds.has(id));

                    if (!hasValidSingleChar && !hasValidArrayChars) {
                        console.warn(`[Cleanup] Converting orphan dialogue to stage direction: "${line.text?.slice(0, 50)}..."`);
                        line.type = "stage_direction";
                        delete line.characterId;
                        delete line.characterIdArray;
                        fixedDialogueCount++;
                    }
                }

                return true;
            });
        }
    }

    if (fixedDialogueCount > 0 || removedLinesCount > 0) {
        console.log(`[Cleanup] Fixed ${fixedDialogueCount} orphan dialogues, removed ${removedLinesCount} invalid lines`);
    }

    return playbook;
}

/**
 * T039: Detect unsupported speakers (crowd/unknown) and emit telemetry events.
 * This helps measure the frequency of unsupported cases for future prioritization.
 */
function detectUnsupportedSpeakers(
    partial: DeepPartial<Playbook>,
    knownCharacterIds: Set<string>,
    controller: ReadableStreamDefaultController,
    unsupportedSeen: Set<string>
) {
    if (!partial.acts) return;

    for (const act of partial.acts) {
        if (!act?.scenes) continue;
        for (const scene of act.scenes) {
            if (!scene?.lines) continue;
            for (const line of scene.lines) {
                if (!line || line.type !== "dialogue") continue;

                // Check if dialogue has no valid character attribution
                const hasValidAttribution =
                    (line.characterId && knownCharacterIds.has(line.characterId)) ||
                    (line.characterIdArray && line.characterIdArray.some(id => id && knownCharacterIds.has(id)));

                if (!hasValidAttribution) {
                    // Create a unique key for this unsupported speaker case
                    const key = `${line.characterId || 'unknown'}-${line.text?.slice(0, 50)}`;
                    if (!unsupportedSeen.has(key)) {
                        unsupportedSeen.add(key);
                        sendEvent(controller, "unsupported_speaker", {
                            kind: line.characterId?.toLowerCase().includes('crowd') ? 'crowd' : 'unknown',
                            sample: line.text?.slice(0, 100),
                            characterId: line.characterId,
                            lineId: line.id
                        });
                    }
                }
            }
        }
    }
}

async function handleFallbackParse(
    text: string,
    llmProvider: "anthropic" | "openai",
    controller: ReadableStreamDefaultController
): Promise<boolean> {
    sendEvent(controller, "info", { message: "No partial chunks yet; attempting fallback parse" });

    try {
        const finalObj = await parsePlayStructure(text, llmProvider);
        const parsed = PlaybookSchema.safeParse(finalObj);

        if (parsed.success) {
            sendEvent(controller, "progress", { percent: 100, message: "Fallback validation complete" });
            sendEvent(controller, "complete", parsed.data);
            __sseClosed = true;
            controller.close();
            return true;
        } else {
            sendEvent(controller, "error", {
                message: `Fallback validation failed: ${parsed.error.message}`,
                code: "VALIDATION_ERROR"
            });
        }
    } catch (fbErr) {
        sendEvent(controller, "error", {
            message: `Fallback parse failed: ${(fbErr as Error).message}`,
            code: "LLM_ERROR"
        });
    }

    __sseClosed = true;
    controller.close();
    return false;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const uploadId = body.uploadId as string | undefined;
    const llmProvider = (body.llmProvider as "anthropic" | "openai" | undefined) || getDefaultProvider();

    if (!uploadId) {
        return new Response(JSON.stringify({ error: "uploadId required" }), { status: 400 });
    }

    // Feature flag: Use new job queue system if enabled
    const useJobQueue = process.env.USE_JOB_QUEUE === "true";

    if (useJobQueue) {
        // NEW JOB QUEUE PATH
        console.log(`[Parse Route] Using job queue system for upload ${uploadId}`);

        const gb = globalThis as unknown as { __uploadBuffers?: Map<string, Buffer> };
        const buffer = gb.__uploadBuffers?.get(uploadId);
        if (!buffer) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        try {
            // Extract text
            let text = "";
            const header = Buffer.from(buffer).subarray(0, 4).toString("hex");
            if (header.startsWith("25504446")) {
                text = await extractTextFromPDF(buffer);
            } else if (header.startsWith("504b")) {
                text = await extractTextFromDOCX(buffer);
            } else {
                text = await extractTextFromTXT(buffer);
            }

            if (!text || text.trim().length === 0) {
                return NextResponse.json(
                    { error: "No text content found in file" },
                    { status: 400 }
                );
            }

            // Enqueue job
            const queue = new JobQueue();
            const jobId = await queue.enqueue({
                rawText: text,
                filename: uploadId,
                config: {
                    chunkSize: 2500,
                    llmProvider,
                },
            });

            console.log(`[Parse Route] Enqueued job ${jobId} for file ${uploadId}`);

            // Return job ID for status polling
            return NextResponse.json({
                jobId,
                message: "Job enqueued successfully. Poll /api/jobs/{jobId} for status."
            });

        } catch (error) {
            console.error(`[Parse Route] Error enqueueing job:`, error);
            return NextResponse.json(
                { error: `Failed to enqueue job: ${(error as Error).message}` },
                { status: 500 }
            );
        }
    }

    // OLD SSE STREAMING PATH (fallback)
    console.log(`[Parse Route] Using legacy SSE streaming for upload ${uploadId}`);

    // Check API key is configured
    const apiKey = llmProvider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({
            error: `${llmProvider.toUpperCase()} API key not configured. Please set ${llmProvider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} in .env.local`
        }), { status: 500 });
    }

    const gb = globalThis as unknown as { __uploadBuffers?: Map<string, Buffer> };
    const buffer = gb.__uploadBuffers?.get(uploadId);
    if (!buffer) {
        return new Response(JSON.stringify({ error: "Upload not found" }), { status: 404 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            __sseClosed = false;
            try {
                // Immediately notify client that stream is open
                sendEvent(controller, "ready", { ts: Date.now() });
                sendEvent(controller, "progress", { percent: 0, message: "Starting extraction" });

                // Detect file type heuristically
                let text = "";
                const header = Buffer.from(buffer).subarray(0, 4).toString("hex");
                try {
                    if (header.startsWith("25504446")) {
                        text = await extractTextFromPDF(buffer);
                    } else if (header.startsWith("504b")) {
                        text = await extractTextFromDOCX(buffer);
                    } else {
                        text = await extractTextFromTXT(buffer);
                    }
                } catch (extractError) {
                    const errMsg = `Failed to extract text: ${(extractError as Error).message}`;
                    sendEvent(controller, "error", { message: errMsg, code: "EXTRACTION_ERROR" });
                    controller.close();
                    return;
                }

                if (!text || text.trim().length === 0) {
                    sendEvent(controller, "error", { message: "No text content found in file", code: "EXTRACTION_ERROR" });
                    controller.close();
                    return;
                }

                sendEvent(controller, "progress", { percent: 2, message: "Text extracted" });

                // Decide parsing strategy based on text length
                const useIncrementalParsing = text.length > INCREMENTAL_PARSE_THRESHOLD;

                if (useIncrementalParsing) {
                    console.log(`[Parse Route] Text length ${text.length} exceeds threshold ${INCREMENTAL_PARSE_THRESHOLD}`);
                    console.log(`[Parse Route] Using incremental parsing for better reliability`);
                    sendEvent(controller, "parse_mode", { mode: "incremental", textLength: text.length });
                } else {
                    console.log(`[Parse Route] Using streaming parsing for text length ${text.length}`);
                    sendEvent(controller, "parse_mode", { mode: "streaming", textLength: text.length });
                }

                // Stream LLM parsing
                sendEvent(controller, "progress", { percent: 3, message: "Parsing with LLM" });
                sendEvent(controller, "llm_provider", { provider: llmProvider });

                console.log(`[Parse Route] Starting LLM parsing with provider: ${llmProvider}`);

                let lastPlaybook: DeepPartial<Playbook> | null = null;
                const charactersSeen = new Set<string>();
                const unsupportedSeen = new Set<string>();
                let actsSeen = 0;
                let scenesSeen = 0;
                let linesCompleted = 0;
                let chunkCount = 0;
                let lastActivity = Date.now();

                // Estimate tokens for progress calculation (rough: 1 token ≈ 4 chars)
                const estimatedTokens = Math.ceil(text.length / 4);
                sendEvent(controller, "token_estimate", { estimatedTokens, textLength: text.length });

                try {
                    // Emit a started event so clients know the call began
                    sendEvent(controller, "llm_started", { textPreview: text.slice(0, 200) });

                    if (useIncrementalParsing) {
                        // === INCREMENTAL PARSING PATH (for long plays) ===
                        console.log(`[Parse Route] Starting incremental parsing`);

                        // T014: Create parsing session on new upload
                        const tempPlaybookId = `temp-${Date.now()}`;
                        const filename = uploadId; // Use uploadId as filename placeholder
                        const chunks = Math.ceil(text.length / 2500); // Estimate chunk count

                        const sessionId = await createParseJob({
                            filename,
                            rawText: text,
                            config: {
                                chunkSize: 2500,
                                llmProvider,
                                tempPlaybookId
                            },
                        });
                        console.log(`[Parse Route] ✅ DB: Created parsing job ${sessionId} with ${chunks} estimated chunks`);

                        // T015: Emit session_created event with sessionId and totalChunks
                        sendEvent(controller, "session_created", {
                            sessionId,
                            totalChunks: chunks,
                            playbookId: tempPlaybookId
                        });

                        await updateParseJob(sessionId, { status: "running", startedAt: new Date() });
                        console.log(`[Parse Route] ✅ DB: Updated job ${sessionId} status to 'running'`);

                        let context: ParsingContext | null = null; // Will be set in loop
                        let saveInProgress = false; // Semaphore to prevent concurrent saves

                        const savePlayFn = async (ctx: ParsingContext, chunk: number) => {
                            // Fire-and-forget async save with semaphore to prevent concurrent writes
                            if (saveInProgress) {
                                console.log(`[Parse Route] ⏭️  DB: Skipping chunk ${chunk} save (previous save still in progress)`);
                                return;
                            }

                            saveInProgress = true;

                            const updateData = buildSessionUpdate(ctx, chunk);

                            // Don't await - let it run in background
                            updateParseJob(sessionId, updateData).then(() => {
                                console.log(`[Parse Route] ✅ DB: Updated session ${sessionId} to chunk ${chunk}`);
                            }).catch((err) => {
                                console.error(`[Parse Route] ❌ DB: Failed to update chunk ${chunk}:`, err);
                            }).finally(() => {
                                saveInProgress = false; // Release semaphore
                            });
                        };

                        let totalSynced = false;
                        for await (const incrementalResult of parsePlayIncrementally(text, llmProvider, 2500, savePlayFn)) {
                            context = incrementalResult.context;
                            lastActivity = Date.now();
                            // Ensure totalChunks stored matches actual chunk count from parser (may differ from estimate)
                            if (!totalSynced && incrementalResult.total !== chunks) {
                                totalSynced = true;
                                updateParseJob(sessionId, { totalChunks: incrementalResult.total }).catch(err => {
                                    console.warn(`[Parse Route] Failed to sync totalChunks to ${incrementalResult.total}:`, err);
                                });
                            }

                            // T017: Update progress event emission to send every chunk completion
                            sendEvent(controller, "progress", {
                                percent: incrementalResult.progress,
                                chunk: incrementalResult.chunk,
                                totalChunks: incrementalResult.total,
                                characters: context.characters.length,
                                lines: context.lastLineNumber,
                                avgChunkTime: incrementalResult.timing.avgChunkTime,
                                estimatedRemaining: incrementalResult.timing.estimatedRemaining,
                                message: `Processing chunk ${incrementalResult.chunk}/${incrementalResult.total}: ${context.lastLineNumber} lines, ${context.characters.length} characters`
                            });

                            // Emit character discoveries
                            for (const char of context.characters) {
                                if (!charactersSeen.has(char.id)) {
                                    charactersSeen.add(char.id);
                                    sendEvent(controller, "character_found", { id: char.id, name: char.name });
                                }
                            }

                            // Update act/scene counts
                            actsSeen = context.acts.length;
                            scenesSeen = context.acts.reduce((total: number, act) => total + act.scenes.length, 0);
                            linesCompleted = context.lastLineNumber;
                        }

                        // Ensure final DB update completes before validation
                        // Wait for any pending save to complete
                        while (saveInProgress) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        if (!context) {
                            // Mark session as failed
                            await updateParseJob(sessionId, {
                                status: "failed",
                                completedAt: new Date(),
                                failureReason: "Incremental parsing failed to produce any results",
                            });
                            console.log(`[Parse Route] ❌ DB: Marked session ${sessionId} as 'failed' - no results`);

                            sendEvent(controller, "error", {
                                message: "Incremental parsing failed to produce any results",
                                code: "PARSE_ERROR"
                            });
                            controller.close();
                            return;
                        }

                        // Convert final context to playbook
                        const finalPlaybook = contextToPlaybook(context);

                        // Fix character ID mismatches before validation
                        const fixedPlaybook = fixCharacterIdMismatches(finalPlaybook);

                        // Clean up orphan dialogues and invalid lines
                        const cleanedPlaybook = cleanupPlaybook(fixedPlaybook);

                        const parsed = PlaybookSchema.safeParse(cleanedPlaybook);

                        if (!parsed.success) {
                            // Mark session as failed
                            await updateParseJob(sessionId, {
                                status: "failed",
                                completedAt: new Date(),
                                failureReason: `Validation failed: ${parsed.error.message}`,
                            });
                            console.log(`[Parse Route] ❌ DB: Marked session ${sessionId} as 'failed' - validation error`);

                            sendEvent(controller, "error", {
                                message: `Validation failed: ${parsed.error.message}`,
                                code: "VALIDATION_ERROR"
                            });
                            controller.close();
                            return;
                        }

                        console.log(`[Parse Route] ✅ Validation passed!`);

                        // Save to database
                        try {
                            await savePlay(parsed.data);
                            console.log(`[Parse Route] ✅ Play saved to database: ${parsed.data.id}`);
                        } catch (dbError) {
                            console.error(`[Parse Route] ❌ Failed to save play to database:`, dbError);

                            // Mark session as failed due to DB save error
                            await updateParseJob(sessionId, {
                                status: "failed",
                                completedAt: new Date(),
                                failureReason: `Database save failed: ${(dbError as Error).message}`,
                            });

                            sendEvent(controller, "error", {
                                message: `Failed to save play: ${(dbError as Error).message}`,
                                code: "DB_SAVE_ERROR"
                            });
                            controller.close();
                            return;
                        }

                        // Mark session as completed and delete
                        await updateParseJob(sessionId, {
                            status: "completed",
                            completedAt: new Date(),
                        });
                        console.log(`[Parse Route] ✅ DB: Marked session ${sessionId} as 'completed'`);

                        await deleteCompletedJobs();
                        console.log(`[Parse Route] ✅ DB: Deleted completed sessions (cleanup)`);

                        console.log(`[Parse Route] ✅ Incremental parsing complete: ${linesCompleted} lines`);

                        // Emit final success events and close
                        sendEvent(controller, "progress", { percent: 100, message: "Parsing complete" });
                        sendEvent(controller, "complete", parsed.data);
                        __sseClosed = true;
                        controller.close();
                        return;

                    } else {
                        // === STREAMING PARSING PATH (for shorter plays) ===
                        // Watchdog: emit keepalive every 5s if no activity
                        const keepalive = setInterval(() => {
                            const idleMs = Date.now() - lastActivity;
                            if (idleMs > 5000) {
                                sendEvent(controller, "keepalive", { idleMs });
                            }
                        }, 5000);

                        let completed = false;
                        // Fallback: if no partial chunks within 20s, attempt non-streaming parse and return
                        const fallbackTimer = setTimeout(async () => {
                            if (chunkCount === 0 && !completed) {
                                completed = await handleFallbackParse(text, llmProvider, controller);
                            }
                        }, 20000);

                        for await (const partial of streamPlayParsing(text, llmProvider)) {
                            if (completed) break;
                            chunkCount++;
                            lastActivity = Date.now();
                            lastPlaybook = partial;

                            const currentLines = countCurrentLines(partial);
                            const newLinesAdded = currentLines - linesCompleted;

                            // Only emit events when significant progress is made (batches of 10 lines)
                            if (newLinesAdded >= 10 || (currentLines > 0 && linesCompleted === 0)) {
                                linesCompleted = currentLines;

                                emitCharacterEvents(partial, charactersSeen, controller);
                                actsSeen = emitActEvents(partial, actsSeen, controller);
                                scenesSeen = emitSceneEvents(partial, scenesSeen, controller);
                                detectUnsupportedSpeakers(partial, charactersSeen, controller, unsupportedSeen);

                                const progress = calculateProgress(linesCompleted, estimatedTokens);
                                sendEvent(controller, "progress", {
                                    percent: progress,
                                    message: `Parsed ${linesCompleted} lines, ${charactersSeen.size} characters, ${actsSeen} acts`
                                });
                            }
                        }
                        if (chunkCount === 0 && !completed) {
                            sendEvent(controller, "info", { message: "No partial chunks received; awaiting final result" });
                        }
                        clearTimeout(fallbackTimer);
                        clearInterval(keepalive);
                    }
                } catch (llmError) {
                    console.error(`[Parse Route] LLM error after ${chunkCount} chunks:`, llmError);
                    const errMsg = `LLM parsing failed after ${chunkCount} chunks: ${(llmError as Error).message}`;
                    sendEvent(controller, "error", { message: errMsg, code: "LLM_ERROR" });
                    __sseClosed = true; controller.close();
                    return;
                }

                console.log(`[Parse Route] LLM stream completed. Chunks received: ${chunkCount}`);
                console.log(`[Parse Route] Last playbook state:`, lastPlaybook ? 'has data' : 'null');

                // Validate final result
                if (!lastPlaybook) {
                    sendEvent(controller, "error", { message: `LLM returned no data (received ${chunkCount} chunks)`, code: "LLM_ERROR" });
                    controller.close();
                    return;
                }

                const parsed = PlaybookSchema.safeParse(lastPlaybook);
                if (!parsed.success) {
                    // Save as temporary play for recovery
                    sendEvent(controller, "error", { message: `Validation failed: ${parsed.error.message}`, code: "VALIDATION_ERROR" });
                    controller.close();
                    return;
                }

                // Save to file-based database

                console.log(`[Parse Route] ✅ Validation passed!`);

                // Save to database
                try {
                    await savePlay(parsed.data);
                    console.log(`[Parse Route] ✅ Play saved to database: ${parsed.data.id}`);
                } catch (dbError) {
                    console.error(`[Parse Route] ❌ Failed to save play to database (streaming mode, no session):`, dbError);
                    sendEvent(controller, "error", {
                        message: `Failed to save play: ${(dbError as Error).message}`,
                        code: "DB_SAVE_ERROR"
                    });
                    // We still close the stream on failure here.
                    controller.close();
                    return;
                }

                sendEvent(controller, "progress", { percent: 100, message: "Validation complete" });
                sendEvent(controller, "complete", parsed.data);
                __sseClosed = true; controller.close();
            } catch (err) {
                const message = (err as Error)?.message || "Unknown error";
                sendEvent(controller, "error", { message });
                __sseClosed = true; controller.close();
            }
        },
    });

    return new Response(stream, { headers: sseHeaders() });
}
