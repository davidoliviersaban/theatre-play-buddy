import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { JobQueue } from "@/jobs/queue";

export const dynamic = "force-dynamic";

/**
 * POST /api/import/sessions/[id]/restart
 * Resets a parsing session to restart the import from the beginning.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ensure the session exists
    const session = await prisma.parsingSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Legacy ParsingSession restart now enqueues a new ParseJob
    const queue = new JobQueue();
    const jobId = await queue.enqueue({
      rawText: session.rawText,
      filename: session.filename,
      config: {
        chunkSize: 2500,
        llmProvider: (process.env.USE_DEFAULT_LLM_PROVIDER as "anthropic" | "openai") || "anthropic",
      },
    });

    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    console.error("[Session Restart API] Error restarting session:", error);
    return NextResponse.json(
      { error: "Failed to restart session" },
      { status: 500 }
    );
  }
}
