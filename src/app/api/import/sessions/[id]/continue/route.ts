import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runParsingSession } from "@/lib/parse/session-runner";

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

    // Set status to parsing to indicate continuation
    await prisma.parsingSession.update({
      where: { id },
      data: {
        status: "parsing",
      },
    });

    // Fire-and-forget background resume from the last saved chunk
    void runParsingSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session Continue API] Error continuing session:", error);
    return NextResponse.json(
      { error: "Failed to continue session" },
      { status: 500 }
    );
  }
}
