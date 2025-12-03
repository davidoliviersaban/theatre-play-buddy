/**
 * GET /api/jobs - List all jobs
 * POST /api/jobs - Create new job (for future use)
 */

import { NextRequest, NextResponse } from "next/server";
import { listJobs } from "@/lib/db/parse-job-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs?status=queued&limit=50
 * List jobs with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "50");

    const jobs = await listJobs({
      status,
      limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[Jobs API] Error listing jobs:", error);
    return NextResponse.json(
      { error: "Failed to list jobs" },
      { status: 500 }
    );
  }
}
