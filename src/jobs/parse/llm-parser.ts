import { generateObject, streamObject } from "ai";
import { PlaybookSchema } from "@/lib/play/schemas";
import { getDefaultProvider, getModel } from "@/jobs/parse/lllm-utils";
import type { LLMProvider } from "@/jobs/parse/lllm-utils";
import { jobLogger } from "@/jobs/logger";

function getPrompt(text: string) {
    const prompt = `You are an expert at analyzing play scripts. Extract the following structured information from this play:

1. Title and metadata (author, year if mentioned, genre, description)
2. All characters with their descriptions
3. Acts and scenes with their titles
4. Line-by-line dialogue and stage directions

CRITICAL FIELD REQUIREMENTS FOR EVERY LINE:
- "text" (string, REQUIRED): The actual dialogue or stage direction text. NEVER omit this field.
- "type" (string, REQUIRED): Must be either "dialogue" or "stage_direction". NEVER omit this field.
- For type="dialogue": MUST have either "characterId" (single speaker) OR "characterIdArray" (multiple speakers)
- For type="stage_direction": characterId/characterIdArray are optional
- "id" (string, REQUIRED): Unique identifier like "act1-scene1-line1"

EXAMPLES:
Dialogue (single speaker):
{
  "id": "act1-scene1-line5",
  "type": "dialogue",
  "characterId": "juliet",
  "text": "O Romeo, Romeo! Wherefore art thou Romeo?"
}

Dialogue (multiple speakers):
{
  "id": "act2-scene3-line12",
  "type": "dialogue",
  "characterIdArray": ["guard1", "guard2"],
  "text": "Who goes there?"
}

Stage direction:
{
  "id": "act1-scene1-line1",
  "type": "stage_direction",
  "text": "Enter ROMEO and MERCUTIO"
}

IMPORTANT RULES:
- NEVER create a line object without "text" and "type" fields
- For dialogue, ALWAYS include characterId OR characterIdArray
- Character IDs should be lowercase, consistent identifiers (e.g., "romeo", "juliet", "laurence")
- For unidentifiable speakers (crowds, anonymous), use stage directions instead of dialogue
- If a line cannot be properly attributed, convert it to a stage_direction with descriptive text

Play text:
${text}`;
    return prompt;
}

export async function parsePlayStructure(text: string, provider: LLMProvider = getDefaultProvider()) {
    const model = getModel(provider);

    const result = await generateObject({
        model,
        schema: PlaybookSchema,
        prompt: getPrompt(text),
    });

    return result.object;
}

export async function* streamPlayStructure(text: string, provider: LLMProvider = getDefaultProvider()) {
    const model = getModel(provider);

    jobLogger.debug({ component: "llm-parser", event: "start", provider, textLength: text.length }, "[LLM Parser] Starting parsing");
    jobLogger.debug({ component: "llm-parser", event: "preview", preview: text.substring(0, 500) }, "[LLM Parser] Text preview (first 500 chars)");

    jobLogger.debug({ component: "llm-parser", event: "stream_object" }, "[LLM Parser] Calling streamObject...");

    const result = streamObject({
        model,
        schema: PlaybookSchema,
        prompt: getPrompt(text),
    });

    jobLogger.debug({ component: "llm-parser", event: "stream_started" }, "[LLM Parser] Stream started, awaiting chunks...");

    const estimatedTokens = Math.ceil(text.length / 4);
    jobLogger.debug({ component: "llm-parser", event: "estimated_tokens", estimatedTokens }, "[LLM Parser] Estimated input tokens");

    let chunkIndex = 0;
    let hasYielded = false;
    let lastLinesCount = 0;
    const startTs = Date.now();
    let lastActivity = startTs;

    try {
        for await (const chunk of result.partialObjectStream) {
            chunkIndex++;
            hasYielded = true;
            lastActivity = Date.now();

            const currentLinesCount = chunk.acts?.reduce((total, act) =>
                total + (act?.scenes?.reduce((sceneTotal, scene) =>
                    sceneTotal + (scene?.lines?.length || 0), 0) || 0), 0) || 0;

            if (currentLinesCount > lastLinesCount) {
                jobLogger.debug({ component: "llm-parser", event: "lines_progress", total: currentLinesCount }, "[LLM Parser] lines completed");
                lastLinesCount = currentLinesCount;
            }

            yield chunk;
        }

        jobLogger.debug({ component: "llm-parser", event: "partial_completed", chunks: chunkIndex, finalLines: lastLinesCount }, "[LLM Parser] Partial stream completed");
    } catch (streamError) {
        jobLogger.error({ component: "llm-parser", event: "partial_error", error: String(streamError) }, "[LLM Parser] Error during partial streaming");
    }

    try {
        jobLogger.debug({ component: "llm-parser", event: "await_final" }, "[LLM Parser] Awaiting final object...");
        const finalResult = await result.object;
        jobLogger.debug({ component: "llm-parser", event: "final_received", exists: !!finalResult }, "[LLM Parser] Final object received");

        if (!hasYielded && finalResult) {
            jobLogger.debug({ component: "llm-parser", event: "yield_final" }, "[LLM Parser] No chunks streamed, yielding complete final object");
            yield finalResult;
        }
    } catch (finalError) {
        jobLogger.error({ component: "llm-parser", event: "final_error", error: String(finalError) }, "[LLM Parser] Error getting final object");

        if (finalError && typeof finalError === 'object' && 'cause' in finalError) {
            const errorWithCause = finalError as { cause?: { issues?: unknown } };
            const cause = errorWithCause.cause;
            if (cause && 'issues' in cause) {
                jobLogger.error({ component: "llm-parser", event: "schema_errors", issues: cause.issues }, "[LLM Parser] Schema validation errors");
            }
        }
        throw new Error(`LLM final result error: ${(finalError as Error).message}`);
    }
    const totalMs = Date.now() - startTs;
    jobLogger.debug({ component: "llm-parser", event: "finished", totalMs, lastIdleMs: Date.now() - lastActivity, chunks: chunkIndex, yielded: hasYielded }, "[LLM Parser] Stream finished");
}