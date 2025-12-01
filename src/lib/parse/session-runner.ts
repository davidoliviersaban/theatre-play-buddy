import { getDefaultProvider } from "./llm-parser";
import { parsePlayIncrementally, contextToPlaybook, type ParsingContext } from "./incremental-parser";
import { PlaybookSchema } from "./schemas";
import { prisma } from "@/lib/db/prisma";
import { savePlay } from "@/lib/db/plays-db-prisma";
import type { Prisma } from "@prisma/client";

/**
 * Background runner to (re)start parsing for a given ParsingSession.
 * Uses the rawText stored on the session and updates session progress.
 */

// Simple in-memory lock to avoid concurrent runners per session
const runningSessions = new Set<string>();

/**
 * Calculate current parsing position from context
 */
function getCurrentPosition(ctx: ParsingContext) {
  let currentActIndex: number | null = null;
  let currentSceneIndex: number | null = null;
  let currentLineIndex: number | null = null;
  let currentCharacters: string[] = [];

  if (ctx.acts.length > 0) {
    currentActIndex = ctx.acts.length - 1;
    const lastAct = ctx.acts[currentActIndex];

    if (lastAct.scenes.length > 0) {
      currentSceneIndex = lastAct.scenes.length - 1;
      const lastScene = lastAct.scenes[currentSceneIndex];

      if (lastScene.lines.length > 0) {
        currentLineIndex = lastScene.lines.length - 1;
        const lastLine = lastScene.lines[currentLineIndex];

        // Extract character names from last line
        if (lastLine.characterId) {
          const char = ctx.characters.find(c => c.id === lastLine.characterId);
          if (char) currentCharacters = [char.name];
        } else if (lastLine.characterIdArray) {
          currentCharacters = lastLine.characterIdArray
            .map(id => ctx.characters.find(c => c.id === id)?.name)
            .filter((name): name is string => !!name);
        }
      }
    }
  }

  return { currentActIndex, currentSceneIndex, currentLineIndex, currentCharacters };
}

/**
 * Serialize ParsingContext to JSON (convert Sets to arrays)
 */
function serializeContext(ctx: ParsingContext): Prisma.InputJsonValue {
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
 * Deserialize saved state back to ParsingContext
 */
function deserializeContext(savedState: unknown): ParsingContext {
  const state = savedState as {
    title?: string;
    author?: string;
    year?: number;
    genre?: string;
    description?: string;
    characters: Array<{ id: string; name: string; description?: string }>;
    acts: Array<{
      id: string;
      title: string;
      scenes: Array<{
        id: string;
        title: string;
        lines: Array<{
          id: string;
          type: "dialogue" | "stage_direction";
          text: string;
          characterId?: string;
          characterIdArray?: string[];
          formatting?: {
            indentLevel?: number;
            preserveLineBreaks?: boolean;
          };
        }>;
      }>;
    }>;
    currentActId?: string;
    currentSceneId?: string;
    lastLineNumber: number;
    lastLineText?: string;
    usedCharacterIds: string[];
    usedActIds: string[];
    usedSceneIds: string[];
    usedLineIds: string[];
  };

  return {
    title: state.title,
    author: state.author,
    year: state.year,
    genre: state.genre,
    description: state.description,
    characters: state.characters,
    acts: state.acts,
    currentActId: state.currentActId,
    currentSceneId: state.currentSceneId,
    lastLineNumber: state.lastLineNumber,
    lastLineText: state.lastLineText,
    usedCharacterIds: new Set(state.usedCharacterIds),
    usedActIds: new Set(state.usedActIds),
    usedSceneIds: new Set(state.usedSceneIds),
    usedLineIds: new Set(state.usedLineIds),
  };
}

/**
 * Build incremental update data for ParsingSession from context
 */
export function buildSessionUpdate(ctx: ParsingContext, chunk: number, baseChunkOffset: number = 0) {
  const position = getCurrentPosition(ctx);
  const currentState = serializeContext(ctx);

  return {
    // Maintain absolute chunk number across resumes by adding base offset
    currentChunk: baseChunkOffset + chunk,
    status: "parsing" as const,
    title: ctx.title,
    author: ctx.author,
    year: ctx.year,
    genre: ctx.genre,
    description: ctx.description,
    currentState,
    totalCharacters: ctx.characters.length,
    totalActs: ctx.acts.length,
    totalScenes: ctx.acts.reduce((sum, act) => sum + act.scenes.length, 0),
    totalLines: ctx.lastLineNumber,
    ...position,
  };
}

/**
 * Mark session as failed with reason
 */
async function markSessionFailed(sessionId: string, reason: string) {
  await prisma.parsingSession.update({
    where: { id: sessionId },
    data: {
      status: "failed",
      failureReason: reason,
      completedAt: new Date(),
    },
  });
}

export async function runParsingSession(sessionId: string, chunkSize = 2500) {
  if (runningSessions.has(sessionId)) {
    console.warn(`[Session Runner] Session ${sessionId} is already running, skipping duplicate start.`);
    return;
  }
  runningSessions.add(sessionId);
  
  try {
    const session = await prisma.parsingSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      console.error(`[Session Runner] Session ${sessionId} not found`);
      return;
    }

    const text = session.rawText;
    if (!text || text.trim().length === 0) {
      await markSessionFailed(sessionId, "No rawText available to parse");
      return;
    }

    // Mark as parsing
    await prisma.parsingSession.update({ where: { id: sessionId }, data: { status: "parsing" } });

    const provider = getDefaultProvider();

    // Create save callback with semaphore to prevent concurrent DB writes
    let saveInProgress = false;
    const baseChunkOffset = session.currentChunk || 0;
    const onSave = async (ctx: ParsingContext, chunk: number) => {
      if (saveInProgress) return;
      saveInProgress = true;
      
      const updateData = buildSessionUpdate(ctx, chunk, baseChunkOffset);
      
      prisma.parsingSession.update({
        where: { id: sessionId },
        data: updateData,
      }).catch((err) => {
        console.error(`[Session Runner] Failed to persist chunk ${chunk}:`, err);
      }).finally(() => { 
        saveInProgress = false; 
      });
    };

    // Restore context from DB if resuming
    let context: ParsingContext | null = null;
    if (session.currentState && session.currentChunk > 0) {
      context = deserializeContext(session.currentState);
      console.log(`[Session Runner] Resuming from chunk ${session.currentChunk} with ${context.characters.length} characters, ${context.acts.length} acts, ${context.lastLineNumber} lines`);
    }

    // Slice input from last completed chunk if resuming
    const startOffset = Math.max(0, (session.currentChunk ?? 0) * chunkSize);
    const resumeText = startOffset > 0 ? text.slice(startOffset) : text;

    // Parse incrementally
    try {
      for await (const inc of parsePlayIncrementally(resumeText, provider, chunkSize, onSave, context ?? undefined)) {
        context = inc.context;
      }
    } catch (err) {
      await markSessionFailed(sessionId, (err as Error).message);
      return;
    }

    if (!context) {
      await markSessionFailed(sessionId, "Parser produced no context");
      return;
    }

    // Validate final playbook
    const finalPlaybook = contextToPlaybook(context, session.playbookId);
    const parsed = PlaybookSchema.safeParse(finalPlaybook);
    if (!parsed.success) {
      await markSessionFailed(sessionId, `Validation failed: ${parsed.error.message}`);
      return;
    }

    // Save to database
    try {
      await savePlay(parsed.data);
      await prisma.parsingSession.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() },
      });
    } catch (dbErr) {
      await markSessionFailed(sessionId, `Save failed: ${(dbErr as Error).message}`);
    }
  } catch (outerErr) {
    console.error(`[Session Runner] Unexpected error for ${sessionId}:`, outerErr);
  } finally {
    runningSessions.delete(sessionId);
  }
}
