import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runParsingSession } from "@/lib/parse/session-runner";

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

    // Reset the session state
    await prisma.parsingSession.update({
      where: { id },
      data: {
        status: "pending",
        currentChunk: 0,
        failureReason: null,
        completedAt: null,
        startedAt: new Date(),
      },
    });

    // Fire-and-forget background resume from the beginning
    // Do not await to keep API responsive
    void runParsingSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session Restart API] Error restarting session:", error);
    return NextResponse.json(
      { error: "Failed to restart session" },
      { status: 500 }
    );
  }
}
