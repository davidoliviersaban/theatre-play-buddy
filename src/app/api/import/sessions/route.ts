import { NextResponse } from "next/server";
import { getActiveJobs, getFailedJobs } from "@/lib/db/parse-job-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/import/sessions
 * Returns all active and failed parsing sessions
 */
export async function GET() {
  try {
    const [activeSessions, failedSessions] = await Promise.all([
      getActiveJobs(),
      getFailedJobs(),
    ]);

    const sessions = [...activeSessions, ...failedSessions].map((job) => ({
      id: job.id,
      filename: job.filename,
      status: job.status,
      currentChunk: job.completedChunks,
      totalChunks: job.totalChunks ?? 0,
      startedAt: job.startedAt?.toISOString() ?? job.createdAt.toISOString(),
      failureReason: job.failureReason,
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
