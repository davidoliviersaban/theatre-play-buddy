import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamObject } from "ai";
import { PlaybookSchema } from "@/lib/play/schemas";

export type LLMProvider = "anthropic" | "openai";

export function getDefaultProvider(): LLMProvider {
    const env = (process.env.DEFAULT_LLM_PROVIDER || "").toLowerCase();
    if (env === "anthropic") return "anthropic";
    if (env === "openai") return "openai";
    if (env === "claude") return "anthropic";
    if (env.startsWith("gpt")) return "openai";
    return "openai";
}

export function getModel(provider: LLMProvider = getDefaultProvider()) {
    if (provider === "anthropic") {
        return anthropic("claude-3-5-sonnet-20241022");
    }
    return openai("gpt-4.1-mini");
}

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

    console.log(`[LLM Parser] Starting parsing with provider: ${provider}`);
    console.log(`[LLM Parser] Text length: ${text.length} characters`);
    console.log(`[LLM Parser] Text preview (first 500 chars):`, text.substring(0, 500));

    console.log(`[LLM Parser] Calling streamObject...`);

    const result = streamObject({
        model,
        schema: PlaybookSchema,
        prompt: getPrompt(text),
    });

    console.log(`[LLM Parser] Stream started, awaiting chunks...`);

    const estimatedTokens = Math.ceil(text.length / 4);
    console.log(`[LLM Parser] Estimated input tokens: ${estimatedTokens}`);

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
                console.log(`[LLM Parser] lines completed (total: ${currentLinesCount})`);
                lastLinesCount = currentLinesCount;
            }

            yield chunk;
        }

        console.log(`[LLM Parser] Partial stream completed. Total chunks: ${chunkIndex}, Final lines: ${lastLinesCount}`);
    } catch (streamError) {
        console.error(`[LLM Parser] Error during partial streaming:`, streamError);
    }

    try {
        console.log(`[LLM Parser] Awaiting final object...`);
        const finalResult = await result.object;
        console.log(`[LLM Parser] Final object received:`, finalResult ? 'exists' : 'null');

        if (!hasYielded && finalResult) {
            console.log(`[LLM Parser] No chunks streamed, yielding complete final object`);
            yield finalResult;
        }
    } catch (finalError) {
        console.error(`[LLM Parser] Error getting final object:`, finalError);

        if (finalError && typeof finalError === 'object' && 'cause' in finalError) {
            const errorWithCause = finalError as { cause?: { issues?: unknown } };
            const cause = errorWithCause.cause;
            if (cause && 'issues' in cause) {
                console.error(`[LLM Parser] Schema validation errors:`, JSON.stringify(cause.issues, null, 2));
            }
        }

        throw new Error(`LLM final result error: ${(finalError as Error).message}`);
    }
    const totalMs = Date.now() - startTs;
    console.log(`[LLM Parser] Stream finished in ${totalMs}ms. Last activity ${(Date.now() - lastActivity)}ms ago. Chunks=${chunkIndex}, yielded=${hasYielded}`);
}