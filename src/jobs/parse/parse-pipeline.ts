/**
 * Unified Parse Pipeline
 * Consolidates streaming and incremental parsing into single execution path
 */

import type { ParseJob } from "@prisma/client";
import type { JobResult, JobProgress } from "@/jobs/types";
import { parsePlayIncrementally, contextToPlaybook, type ParsingContext } from "./incremental/parser";
import { PlaybookSchema } from "@/lib/play/schemas";
import { savePlay } from "@/lib/db/plays-db-prisma";
import { prisma } from "@/lib/db/prisma";

// Import fixCharacterIdMismatches from session-runner (will be refactored later)
function fixCharacterIdMismatches(playbook: any): any {
  // Ensure all dialogue lines have proper character attribution
  if (!playbook.acts) return playbook;

  const normalizeDialogue = (line: any) => {
    if (line.type !== "dialogue") return;
    if (Array.isArray(line.characterIdArray) && line.characterIdArray.length > 0) {
      line.characters = line.characterIdArray.map((id: string) => ({ characterId: id }));
    } else if (line.characterId) {
      line.characters = [{ characterId: line.characterId }];
    }
    delete line.characterId;
    delete line.characterIdArray;
  };

  for (const act of playbook.acts ?? []) {
    for (const scene of act.scenes ?? []) {
      for (const line of scene.lines ?? []) {
        normalizeDialogue(line);
      }
    }
  }

  return playbook;
}

/**
 * Serialize ParsingContext to JSON for storage
 */
function serializeContext(ctx: ParsingContext): unknown {
  return {
    title: ctx.title,
    author: ctx.author,
    year: ctx.year,
    genre: ctx.genre,
    description: ctx.description,
    characters: ctx.characters,
    acts: ctx.acts,
    currentActId: ctx.currentActId,
    currentSceneId: ctx.currentSceneId,
    lastLineNumber: ctx.lastLineNumber,
    lastLineText: ctx.lastLineText,
    usedCharacterIds: Array.from(ctx.usedCharacterIds),
    usedActIds: Array.from(ctx.usedActIds),
    usedSceneIds: Array.from(ctx.usedSceneIds),
    usedLineIds: Array.from(ctx.usedLineIds),
  };
}

/**
 * Deserialize ParsingContext from JSON storage
 */
function deserializeContext(data: unknown): ParsingContext {
  const obj = data as Record<string, unknown>;
  return {
    title: obj.title as string | undefined,
    author: obj.author as string | undefined,
    year: obj.year as number | undefined,
    genre: obj.genre as string | undefined,
    description: obj.description as string | undefined,
    characters: (obj.characters as any[]) || [],
    acts: (obj.acts as any[]) || [],
    currentActId: obj.currentActId as string | undefined,
    currentSceneId: obj.currentSceneId as string | undefined,
    lastLineNumber: (obj.lastLineNumber as number) || 0,
    lastLineText: obj.lastLineText as string | undefined,
    usedCharacterIds: new Set((obj.usedCharacterIds as string[]) || []),
    usedActIds: new Set((obj.usedActIds as string[]) || []),
    usedSceneIds: new Set((obj.usedSceneIds as string[]) || []),
    usedLineIds: new Set((obj.usedLineIds as string[]) || []),
  };
}

/**
 * Restore context from job state if resuming
 */
function restoreContext(currentState: unknown): ParsingContext | null {
  if (!currentState) {
    return null;
  }
  try {
    return deserializeContext(currentState);
  } catch (error) {
    console.error("[Pipeline] Failed to restore context:", error);
    return null;
  }
}

/**
 * Cleanup playbook by removing invalid data
 */
function cleanupPlaybook(playbook: any): any {
  // Remove any dialogue lines without character attribution
  for (const act of playbook.acts ?? []) {
    for (const scene of act.scenes ?? []) {
      if (!Array.isArray(scene.lines)) continue;
      scene.lines = scene.lines.filter((line: any) => {
        // Keep stage directions
        if (line.type === "stage_direction") return true;
        // Keep dialogue with at least one character
        if (line.type === "dialogue") {
          const chars = Array.isArray(line.characters) ? line.characters.length : 0;
          const hasId = typeof line.characterId === "string" && line.characterId.length > 0;
          return chars > 0 || hasId;
        }
        // Keep unknown types by default (could be extended later)
        return true;
      });
    }
  }
  return playbook;
}

/**
 * Execute the unified parse pipeline for a job
 */
export async function parseJobPipeline(
  job: ParseJob,
  onProgress: (progress: JobProgress) => Promise<void>
): Promise<JobResult> {
  console.log(`[Pipeline] Starting parse for job ${job.id}`);

  // Step 1: Extract text (already done, stored in rawText)
  const text = job.rawText;
  if (!text || text.trim().length === 0) {
    throw new Error("No text to parse");
  }

  // Step 2: Get configuration
  const config = job.config as any;
  const chunkSize = config?.chunkSize ?? 2500;
  const llmProvider = config?.llmProvider ?? "anthropic";

  // Step 3: Restore context if resuming
  let context = restoreContext(job.currentState);
  if (context) {
    console.log(
      `[Pipeline] Resuming from chunk ${job.completedChunks}: ` +
      `${context.characters.length} characters, ${context.acts.length} acts, ` +
      `${context.lastLineNumber} lines`
    );
  }

  // Step 4: Parse incrementally with checkpointing
  try {
    let totalChunks = job.totalChunks ?? 0;

    for await (const inc of parsePlayIncrementally(
      text,
      llmProvider,
      chunkSize,
      async (ctx: ParsingContext, chunk: number) => {
        // Checkpoint: save context to database
        const serialized = serializeContext(ctx);

        await prisma.parseJob.update({
          where: { id: job.id },
          data: {
            currentState: serialized as any,
            completedChunks: chunk,
            totalChunks: inc.total,
          },
        });

        // Report progress to caller
        await onProgress({
          chunksCompleted: chunk,
          totalChunks: inc.total,
          linesCompleted: ctx.lastLineNumber,
          progress: (chunk / inc.total) * 100,
        });
      },
      context ?? undefined
    )) {
      context = inc.context;
      totalChunks = inc.total;
    }

    if (!context) {
      throw new Error("Parsing failed to produce any results");
    }

    console.log(
      `[Pipeline] Parsing complete: ${context.characters.length} characters, ` +
      `${context.acts.length} acts, ${context.lastLineNumber} lines`
    );

    // Step 5: Convert to playbook
    const playbook = contextToPlaybook(context);

    // Step 6: Fix character ID mismatches
    const fixed = fixCharacterIdMismatches(playbook);

    // Step 7: Clean up invalid data
    const cleaned = cleanupPlaybook(fixed);

    // Step 8: Validate schema
    const parsed = PlaybookSchema.safeParse(cleaned);
    if (!parsed.success) {
      console.error("[Pipeline] Validation failed:", parsed.error.format());
      throw new Error(`Validation failed: ${parsed.error.message}`);
    }

    console.log(`[Pipeline] Validation passed for job ${job.id}`);

    // Step 9: Save to database
    await savePlay(parsed.data);
    console.log(`[Pipeline] Saved playbook ${parsed.data.id} to database`);

    return {
      status: "completed",
      playbookId: parsed.data.id,
    };
  } catch (error) {
    // Checkpoint current state on error for resume capability
    if (context) {
      const serialized = serializeContext(context);
      await prisma.parseJob.update({
        where: { id: job.id },
        data: {
          currentState: serialized as any,
        },
      }).catch((err) => {
        console.error("[Pipeline] Failed to checkpoint on error:", err);
      });
    }

    // Re-throw error for worker to handle
    throw error;
  }
}
