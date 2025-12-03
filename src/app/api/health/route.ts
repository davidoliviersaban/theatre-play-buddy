/**
 * GET /api/health - System health check
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWorkerCount } from "@/jobs/parse/bootstrap";

export const dynamic = "force-dynamic";

/**
 * Get count of active workers (workers with recent heartbeat)
 */
async function getActiveWorkerCount(): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const activeWorkers = await prisma.parseJob.findMany({
    where: {
      status: "running",
      lockedAt: { gte: oneMinuteAgo },
      workerId: { not: null },
    },
    select: { workerId: true },
    distinct: ["workerId"],
  });

  return activeWorkers.length;
}

/**
 * Get age of oldest queued job in milliseconds
 */
async function getOldestQueuedJobAge(): Promise<number> {
  const oldest = await prisma.parseJob.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (!oldest) return 0;
  return Date.now() - oldest.createdAt.getTime();
}

/**
 * Get count of stuck jobs (running > 30 minutes)
 */
async function getStuckJobCount(): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const stuckJobs = await prisma.parseJob.count({
    where: {
      status: "running",
      startedAt: { lt: thirtyMinutesAgo },
    },
  });

  return stuckJobs;
}

export async function GET() {
  try {
    const [configuredWorkers, activeWorkers, oldestJobAge, stuckJobs] =
      await Promise.all([
        Promise.resolve(getWorkerCount()),
        getActiveWorkerCount(),
        getOldestQueuedJobAge(),
        getStuckJobCount(),
      ]);

    const health = {
      configuredWorkers,
      activeWorkers,
      oldestQueuedJobAgeMs: oldestJobAge,
      oldestQueuedJobAgeSec: Math.round(oldestJobAge / 1000),
      stuckJobs,
    };

    // Determine health status
    const isHealthy =
      activeWorkers > 0 &&
      oldestJobAge < 5 * 60 * 1000 && // < 5 min wait
      stuckJobs === 0;

    const status = isHealthy ? "healthy" : "degraded";
    const httpStatus = isHealthy ? 200 : 503;

    return NextResponse.json(
      { status, ...health },
      { status: httpStatus }
    );
  } catch (error) {
    console.error("[Health API] Error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Failed to check health"
      },
      { status: 503 }
    );
  }
}
