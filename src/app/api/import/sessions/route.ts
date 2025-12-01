import { NextResponse } from "next/server";
import { getActiveSessions, getFailedSessions } from "@/lib/db/parsing-session-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/import/sessions
 * Returns all active and failed parsing sessions
 */
export async function GET() {
  try {
    const [activeSessions, failedSessions] = await Promise.all([
      getActiveSessions(),
      getFailedSessions(),
    ]);

    const sessions = [...activeSessions, ...failedSessions].map((session) => ({
      id: session.id,
      filename: session.filename,
      status: session.status,
      currentChunk: session.currentChunk,
      totalChunks: session.totalChunks,
      startedAt: session.startedAt.toISOString(),
      failureReason: session.failureReason,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Sessions API] Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
