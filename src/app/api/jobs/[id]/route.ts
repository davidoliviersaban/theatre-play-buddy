/**
 * GET /api/jobs/[id] - Get job status
 */

import { NextRequest, NextResponse } from "next/server";
import { getParseJob } from "@/lib/db/parse-job-db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getParseJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error(`[Jobs API] Error fetching job:`, error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
