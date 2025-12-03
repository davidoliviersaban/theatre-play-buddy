/**
 * GET /api/metrics - Job queue metrics
 */

import { NextResponse } from "next/server";
import { countJobsByStatus } from "@/lib/db/parse-job-db";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Calculate average processing time for completed jobs
 */
async function getAvgProcessingTime(): Promise<number> {
  const jobs = await prisma.parseJob.findMany({
    where: {
      status: "completed",
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
    take: 100, // Last 100 completed jobs
    orderBy: { completedAt: "desc" },
  });

  if (jobs.length === 0) return 0;

  const totalMs = jobs.reduce((sum, job) => {
    const duration =
      job.completedAt!.getTime() - job.startedAt!.getTime();
    return sum + duration;
  }, 0);

  return Math.round(totalMs / jobs.length);
}

/**
 * Calculate 95th percentile processing time
 */
async function getP95ProcessingTime(): Promise<number> {
  const jobs = await prisma.parseJob.findMany({
    where: {
      status: "completed",
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
    take: 100,
    orderBy: { completedAt: "desc" },
  });

  if (jobs.length === 0) return 0;

  const durations = jobs
    .map((job) => job.completedAt!.getTime() - job.startedAt!.getTime())
    .sort((a, b) => a - b);

  const p95Index = Math.floor(durations.length * 0.95);
  return durations[p95Index] || 0;
}

export async function GET() {
  try {
    const [statusCounts, avgTime, p95Time] = await Promise.all([
      countJobsByStatus(),
      getAvgProcessingTime(),
      getP95ProcessingTime(),
    ]);

    const metrics = {
      queueDepth: statusCounts.queued || 0,
      runningJobs: statusCounts.running || 0,
      pausedJobs: statusCounts.paused || 0,
      retryingJobs: statusCounts.retrying || 0,
      completedJobs: statusCounts.completed || 0,
      failedJobs: statusCounts.failed || 0,
      cancelledJobs: statusCounts.cancelled || 0,
      avgProcessingTimeMs: avgTime,
      p95ProcessingTimeMs: p95Time,
      avgProcessingTimeSec: Math.round(avgTime / 1000),
      p95ProcessingTimeSec: Math.round(p95Time / 1000),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Metrics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
