import { generateObject } from "ai";
import { z } from "zod";
import type { Playbook, Act, Line } from "./schemas";
import { CharacterSchema } from "./schemas";
import { getDefaultProvider, getModel, type LLMProvider } from "./llm-parser";

type Character = z.infer<typeof CharacterSchema>;

/**
 * Context carried between parsing chunks to maintain continuity
 */
export interface ParsingContext {
    // Metadata
    title?: string;
    author?: string;
    year?: number;
    genre?: string;
    description?: string;
    
    // Characters discovered so far
    characters: Character[];
    
    // Current structure state
    acts: Act[];
    currentActId?: string;
    currentSceneId?: string;
    
    // Last line processed (for continuity)
    lastLineNumber: number;
    lastLineText?: string; // optional, for reference if line was cut off
    
    // IDs used so far (for uniqueness)
    usedCharacterIds: Set<string>;
    usedActIds: Set<string>;
    usedSceneIds: Set<string>;
    usedLineIds: Set<string>;
}

/**
 * Schema for incremental parsing results
 */
const IncrementalParseResultSchema = z.object({
    // New metadata (only if this chunk contains it)
    title: z.string().optional(),
    author: z.string().optional(),
    year: z.number().int().optional(),
    genre: z.string().optional(),
    description: z.string().optional(),
    
    // New characters discovered in this chunk
    newCharacters: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
    })).optional(),
    
    // Acts and scenes parsed in this chunk
    acts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        isNew: z.boolean().optional(), // true if this is a new act, false if continuing previous
        scenes: z.array(z.object({
            id: z.string(),
            title: z.string(),
            isNew: z.boolean().optional(), // true if new scene, false if continuing
            lines: z.array(z.object({
                id: z.string(),
                type: z.enum(["dialogue", "stage_direction"]),
                text: z.string(),
                characterId: z.string().optional(),
                characterIdArray: z.array(z.string()).optional(),
            })),
        })),
    })),
});

type IncrementalParseResult = z.infer<typeof IncrementalParseResultSchema>;

/**
 * Split text into manageable chunks (approximately by page/scene)
 * Aims for ~2000-3000 characters per chunk to stay within token limits
 */
function splitIntoChunks(text: string, chunkSize: number = 2500): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
        if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += line + '\n';
    }
    
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

/**
 * Parse a chunk of text with context from previous chunks
 */
async function parseChunkWithContext(
    chunk: string,
    context: ParsingContext,
    chunkIndex: number,
    totalChunks: number,
    provider: LLMProvider
): Promise<IncrementalParseResult> {
    const model = getModel(provider);
    
    // Build context summary for the LLM
    const contextSummary = {
        charactersKnown: context.characters.map(c => `${c.id}: ${c.name}`).join(', '),
        currentAct: context.currentActId || 'unknown',
        currentScene: context.currentSceneId || 'unknown',
        actsSeenSoFar: Array.from(context.usedActIds).join(', '),
        scenesSeenSoFar: Array.from(context.usedSceneIds).join(', '),
        lastLineNumber: context.lastLineNumber,
    };
    
    const prompt = `You are parsing chunk ${chunkIndex + 1} of ${totalChunks} from a play script.

${context.title ? `PLAY TITLE: ${context.title}` : ''}
${context.author ? `AUTHOR: ${context.author}` : ''}

CONTEXT FROM PREVIOUS CHUNKS:
- Known characters: ${contextSummary.charactersKnown || 'none yet'}
- Current act: ${contextSummary.currentAct}
- Current scene: ${contextSummary.currentScene}
- Acts seen so far: ${contextSummary.actsSeenSoFar || 'none'}
- Scenes seen so far: ${contextSummary.scenesSeenSoFar || 'none'}
- Last line number: ${contextSummary.lastLineNumber}

INSTRUCTIONS FOR THIS CHUNK:
1. If this is the first chunk and contains metadata (title, author, year, genre), extract it
2. Identify any NEW characters not in the known characters list
3. Parse all dialogue and stage directions
4. For each act/scene:
   - If continuing from previous chunk, set isNew=false and use the same act/scene ID
   - If starting a new act/scene, set isNew=true and create a new ID
5. Use character IDs that match the known characters list
6. Create unique line IDs starting from line ${context.lastLineNumber + 1}

CRITICAL RULES:
- NEVER create a line without "text" and "type" fields
- For dialogue, ALWAYS include characterId OR characterIdArray
- Line IDs must be unique: "act{N}-scene{M}-line{X}" where X continues from ${context.lastLineNumber + 1}
- Reuse existing character IDs when referring to known characters
- Mark isNew=false if continuing the previous act/scene

TEXT CHUNK TO PARSE:
${chunk}`;

    const result = await generateObject({
        model,
        schema: IncrementalParseResultSchema,
        prompt,
    });
    
    return result.object;
}

/**
 * Merge incremental result into the accumulated context
 */
function mergeIntoContext(
    result: IncrementalParseResult,
    context: ParsingContext
): void {
    // Update metadata if provided
    if (result.title) context.title = result.title;
    if (result.author) context.author = result.author;
    if (result.year) context.year = result.year;
    if (result.genre) context.genre = result.genre;
    if (result.description) context.description = result.description;
    
    // Add new characters
    if (result.newCharacters) {
        for (const char of result.newCharacters) {
            if (!context.usedCharacterIds.has(char.id)) {
                context.characters.push(char);
                context.usedCharacterIds.add(char.id);
            }
        }
    }
    
    // Merge acts and scenes
    for (const resultAct of result.acts) {
        let targetAct = context.acts.find(a => a.id === resultAct.id);
        
        if (!targetAct || resultAct.isNew) {
            // Create new act
            targetAct = {
                id: resultAct.id,
                title: resultAct.title,
                scenes: [],
            };
            context.acts.push(targetAct);
            context.usedActIds.add(resultAct.id);
            context.currentActId = resultAct.id;
        }
        
        // Merge scenes
        for (const resultScene of resultAct.scenes) {
            let targetScene = targetAct.scenes.find(s => s.id === resultScene.id);
            
            if (!targetScene || resultScene.isNew) {
                // Create new scene
                targetScene = {
                    id: resultScene.id,
                    title: resultScene.title,
                    lines: [],
                };
                targetAct.scenes.push(targetScene);
                context.usedSceneIds.add(resultScene.id);
                context.currentSceneId = resultScene.id;
            }
            
            // Add lines
            for (const line of resultScene.lines) {
                if (!context.usedLineIds.has(line.id)) {
                    targetScene.lines.push(line as Line);
                    context.usedLineIds.add(line.id);
                    context.lastLineNumber++;
                }
            }
        }
    }
}

/**
 * Parse a play incrementally in chunks with context retention
 */
export async function* parsePlayIncrementally(
    text: string,
    provider: LLMProvider = getDefaultProvider(),
    chunkSize: number = 2500,
    onSave?: (context: ParsingContext, chunk: number) => Promise<void>,
    initialContext?: ParsingContext
): AsyncGenerator<{ context: ParsingContext; progress: number; chunk: number; total: number; timing: { avgChunkTime: number; estimatedRemaining: number } }> {
    console.log(`[Incremental Parser] Starting incremental parsing`);
    console.log(`[Incremental Parser] Text length: ${text.length} characters`);
    console.log(`[Incremental Parser] Chunk size: ${chunkSize} characters`);
    
    const startTime = Date.now();
    const chunkTimes: number[] = [];
    
    // Split into chunks
    const chunks = splitIntoChunks(text, chunkSize);
    console.log(`[Incremental Parser] Split into ${chunks.length} chunks`);
    
    // Initialize context (use provided or create fresh)
    const context: ParsingContext = initialContext ?? {
        characters: [],
        acts: [],
        lastLineNumber: 0,
        usedCharacterIds: new Set(),
        usedActIds: new Set(),
        usedSceneIds: new Set(),
        usedLineIds: new Set(),
    };
    
    if (initialContext) {
        console.log(`[Incremental Parser] Resuming with initial context: ${context.characters.length} characters, ${context.acts.length} acts, ${context.lastLineNumber} lines`);
    }
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
        const chunkStartTime = Date.now();
        console.log(`[Incremental Parser] Processing chunk ${i + 1}/${chunks.length}`);
        
        try {
            const result = await parseChunkWithContext(chunks[i], context, i, chunks.length, provider);
            mergeIntoContext(result, context);
            
            const chunkTime = Date.now() - chunkStartTime;
            chunkTimes.push(chunkTime);
            
            const avgChunkTime = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length;
            const estimatedRemaining = avgChunkTime * (chunks.length - i - 1);
            
            console.log(`[Incremental Parser] Chunk ${i + 1} took ${chunkTime}ms, avg: ${avgChunkTime.toFixed(0)}ms, est. remaining: ${(estimatedRemaining / 1000).toFixed(0)}s`);
            
            // Call onSave callback if provided
            if (onSave) {
                await onSave(context, i + 1);
            }
            
            const progress = Math.round(((i + 1) / chunks.length) * 100);
            
            yield {
                context,
                progress,
                chunk: i + 1,
                total: chunks.length,
                timing: {
                    avgChunkTime: Math.round(avgChunkTime),
                    estimatedRemaining: Math.round(estimatedRemaining),
                },
            };
        } catch (error) {
            console.error(`[Incremental Parser] Error processing chunk ${i + 1}:`, error);
            throw new Error(`Failed to parse chunk ${i + 1}/${chunks.length}: ${(error as Error).message}`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[Incremental Parser] Completed parsing ${chunks.length} chunks in ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`[Incremental Parser] Final stats: ${context.characters.length} characters, ${context.acts.length} acts, ${context.lastLineNumber} lines`);
}

/**
 * Convert parsing context to final Playbook format
 */
export function contextToPlaybook(context: ParsingContext, fallbackId: string = 'imported-play'): Playbook {
    const playId = context.title
        ? context.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : fallbackId;
    
    return {
        id: playId,
        title: context.title || 'Untitled Play',
        author: context.author || 'Unknown Author',
        year: context.year ?? new Date().getFullYear(),
        genre: context.genre ?? 'Drama',
        description: context.description ?? '',
        characters: context.characters,
        acts: context.acts,
    };
}
