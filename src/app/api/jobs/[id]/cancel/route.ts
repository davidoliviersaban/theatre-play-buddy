/**
 * POST /api/jobs/[id]/cancel - Cancel a job
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

    await queue.cancel(id);

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully"
    });
  } catch (error) {
    console.error(`[Jobs API] Error cancelling job:`, error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
