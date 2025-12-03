import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { JobQueue } from "@/jobs/queue";

export const dynamic = "force-dynamic";

/**
 * POST /api/import/sessions/[id]/continue
 * Marks a parsing session as 'parsing' to continue from the last saved chunk.
 * (Actual resume execution is handled by the incremental parser when invoked.)
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

    // Legacy continue: enqueue a new ParseJob from the stored rawText
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
    console.error("[Session Continue API] Error continuing session:", error);
    return NextResponse.json(
      { error: "Failed to continue session" },
      { status: 500 }
    );
  }
}
