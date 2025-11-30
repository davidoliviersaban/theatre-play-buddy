import { NextRequest } from "next/server";
import { extractTextFromPDF, extractTextFromDOCX, extractTextFromTXT } from "../../../../lib/parse/extractors";
import { PlaybookSchema, type Playbook } from "../../../../lib/parse/schemas";
import { streamPlayParsing, getDefaultProvider, parsePlayStructure } from "../../../../lib/parse/llm-parser";
import { savePlay } from "../../../../lib/db/plays-db";
import type { DeepPartial } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    return Math.min(Math.round(linesCompleted / estimatedTokens * 1000), 100);
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
                    sendEvent(controller, "error", { message: `Validation failed: ${parsed.error.message}`, code: "VALIDATION_ERROR" });
                    controller.close();
                    return;
                }

                // Save to file-based database
                try {
                    await savePlay(parsed.data);
                    console.log(`[Parse Route] Play saved to database: ${parsed.data.id}`);
                } catch (dbError) {
                    console.error(`[Parse Route] Failed to save play to database:`, dbError);
                    // Don't fail the request, just log the error
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
