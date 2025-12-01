/**
 * Database operations for ParsingSession model
 * Tracks parsing progress, failures, and resume capability
 */

import { prisma } from "./prisma";
import type { ParsingStatus, ParsingSession, Prisma } from "@prisma/client";

export interface CreateSessionData {
  playbookId: string;
  filename: string;
  rawText: string;
  totalChunks: number;
}

export interface UpdateSessionData {
  status?: ParsingStatus;
  currentChunk?: number;
  totalChunks?: number; // absolute total number of chunks (may be corrected after actual splitting)
  completedAt?: Date;
  failureReason?: string;
  // Play metadata
  title?: string;
  author?: string;
  year?: number;
  genre?: string;
  description?: string;
  // Incremental state (use Prisma's JSON input type)
  currentState?: Prisma.InputJsonValue;
  // Counts
  totalCharacters?: number;
  totalActs?: number;
  totalScenes?: number;
  totalLines?: number;
  // Current position
  currentActIndex?: number | null;
  currentSceneIndex?: number | null;
  currentLineIndex?: number | null;
  currentCharacters?: string[];
}

/**
 * Create a new parsing session
 */
export async function createParsingSession(data: CreateSessionData): Promise<string> {
  const session = await prisma.parsingSession.create({
    data: {
      playbookId: data.playbookId,
      filename: data.filename,
      rawText: data.rawText,
      totalChunks: data.totalChunks,
      status: "pending",
      currentChunk: 0,
    },
  });

  console.log(`[ParsingSession] Created session ${session.id} for ${data.filename}`);
  return session.id;
}

/**
 * Update an existing parsing session
 */
export async function updateParsingSession(
  sessionId: string,
  data: UpdateSessionData
): Promise<void> {
  await prisma.parsingSession.update({
    where: { id: sessionId },
    data,
  });

  console.log(`[ParsingSession] Updated session ${sessionId}:`, data);
}

/**
 * Get all failed parsing sessions
 */
export async function getFailedSessions(): Promise<ParsingSession[]> {
  return prisma.parsingSession.findMany({
    where: {
      status: "failed",
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

/**
 * Get all active parsing sessions (pending, warming, parsing)
 */
export async function getActiveSessions(): Promise<ParsingSession[]> {
  return prisma.parsingSession.findMany({
    where: {
      status: {
        in: ["pending", "warming", "parsing"],
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

/**
 * Get session for resume (failed or incomplete)
 */
export async function getSessionForResume(sessionId: string): Promise<ParsingSession | null> {
  return prisma.parsingSession.findUnique({
    where: { id: sessionId },
  });
}

/**
 * Delete completed sessions to save DB space
 */
export async function deleteCompletedSessions(): Promise<number> {
  const result = await prisma.parsingSession.deleteMany({
    where: {
      status: "completed",
    },
  });

  console.log(`[ParsingSession] Deleted ${result.count} completed sessions`);
  return result.count;
}

