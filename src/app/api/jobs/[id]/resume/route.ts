/**
 * POST /api/jobs/[id]/resume - Resume a paused job
 */

import { NextRequest, NextResponse } from "next/server";
import { JobQueue } from "@/jobs/queue";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queue = new JobQueue();

    await queue.resume(id);

    return NextResponse.json({
      success: true,
      message: "Job resumed successfully (re-queued for pickup)"
    });
  } catch (error) {
    console.error(`[Jobs API] Error resuming job:`, error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
