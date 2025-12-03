/**
 * Database operations for ParseJob model
 * Tracks parsing job progress, failures, and resume capability with distributed locking
 */

import { prisma } from "./prisma";
import type { JobStatus, ParseJob, Prisma } from "@prisma/client";

export interface CreateJobData {
  rawText: string;
  filename: string;
  config?: Prisma.InputJsonValue;
  priority?: number;
  maxRetries?: number;
}

export interface UpdateJobData {
  status?: JobStatus;
  completedChunks?: number;
  totalChunks?: number;
  progress?: number;
  completedAt?: Date;
  startedAt?: Date;
  failureReason?: string;
  lastError?: string;
  currentState?: Prisma.InputJsonValue;
  checkpoints?: Prisma.InputJsonValue;
  retryCount?: number;
  playbookId?: string;
  // Lock fields
  workerId?: string | null;
  lockedAt?: Date | null;
  lockExpiry?: Date | null;
}

/**
 * Create a new parsing job
 */
export async function createParseJob(data: CreateJobData): Promise<string> {
  const job = await prisma.parseJob.create({
    data: {
      type: "PARSE_PLAY",
      rawText: data.rawText,
      filename: data.filename,
      config: data.config,
      priority: data.priority ?? 0,
      maxRetries: data.maxRetries ?? 3,
      status: "queued",
    },
  });

  console.log(`[ParseJob] Created job ${job.id} for ${data.filename}`);
  return job.id;
}

/**
 * Update an existing parsing job
 */
export async function updateParseJob(
  jobId: string,
  data: UpdateJobData
): Promise<void> {
  await prisma.parseJob.update({
    where: { id: jobId },
    data,
  });

  console.log(`[ParseJob] Updated job ${jobId}:`, Object.keys(data).join(", "));
}

/**
 * Get a job by ID
 */
export async function getParseJob(jobId: string): Promise<ParseJob | null> {
  return prisma.parseJob.findUnique({
    where: { id: jobId },
  });
}

/**
 * Get all failed jobs
 */
export async function getFailedJobs(): Promise<ParseJob[]> {
  return prisma.parseJob.findMany({
    where: {
      status: "failed",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get all active jobs (queued, running, paused, retrying)
 */
export async function getActiveJobs(): Promise<ParseJob[]> {
  return prisma.parseJob.findMany({
    where: {
      status: {
        in: ["queued", "running", "paused", "retrying"],
      },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  });
}

/**
 * Get job for resume (failed or paused)
 */
export async function getJobForResume(jobId: string): Promise<ParseJob | null> {
  return prisma.parseJob.findUnique({
    where: { id: jobId },
  });
}

/**
 * Delete completed jobs to save DB space
 */
export async function deleteCompletedJobs(olderThanDays: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.parseJob.deleteMany({
    where: {
      status: "completed",
      completedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[ParseJob] Deleted ${result.count} completed jobs older than ${olderThanDays} days`);
  return result.count;
}

/**
 * List jobs with optional filters
 */
export async function listJobs(options?: {
  status?: JobStatus;
  limit?: number;
  offset?: number;
}): Promise<ParseJob[]> {
  const { status, limit = 50, offset = 0 } = options ?? {};

  return prisma.parseJob.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Count jobs by status
 */
export async function countJobsByStatus(): Promise<Record<string, number>> {
  const counts = await prisma.parseJob.groupBy({
    by: ["status"],
    _count: true,
  });

  return counts.reduce(
    (acc, { status, _count }) => {
      acc[status] = _count;
      return acc;
    },
    {} as Record<string, number>
  );
}
