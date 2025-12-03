/**
 * POST /api/jobs/[id]/pause - Pause a running job
 */

import { NextRequest, NextResponse } from "next/server";
import { JobQueue } from "@/lib/jobs/queue";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queue = new JobQueue();

    await queue.pause(id);

    return NextResponse.json({
      success: true,
      message: "Job paused successfully"
    });
  } catch (error) {
    console.error(`[Jobs API] Error pausing job:`, error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
