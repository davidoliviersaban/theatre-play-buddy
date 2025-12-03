/**
 * Job Queue Service
 * Manages the lifecycle of parse jobs with distributed locking
 */

import { prisma } from "../db/prisma";
import type { ParseJob, Prisma } from "@prisma/client";
import type { ParseJobInput, JobResult, JobUpdateData } from "./types";
import { assertTransition } from "./state-machine";
import { jobLogger } from "./logger";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export class JobQueue {
  /**
   * Enqueue a new parse job
   */
  async enqueue(input: ParseJobInput): Promise<string> {
    const job = await prisma.parseJob.create({
      data: {
        type: "PARSE_PLAY",
        rawText: input.rawText,
        filename: input.filename,
        config: input.config as Prisma.InputJsonValue,
        priority: input.priority ?? 0,
        maxRetries: input.maxRetries ?? 3,
        status: "queued",
      },
    });

    jobLogger.info({
      event: "job.enqueued",
      jobId: job.id,
      priority: job.priority,
      filename: input.filename,
    }, "Job enqueued");
    return job.id;
  }

  /**
   * Claim the next available job with distributed lock
   * Returns null if no jobs are available
   */
  async claimNext(workerId: string): Promise<ParseJob | null> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);

    // Use transaction to ensure atomic claim
    const job = await prisma.$transaction(async (tx) => {
      // Find highest priority queued job or job with expired lock
      const candidate = await tx.parseJob.findFirst({
        where: {
          OR: [
            { status: "queued" },
            {
              status: "running",
              lockExpiry: { lt: now }, // Lock expired
            },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      if (!candidate) {
        return null;
      }

      // Claim it by setting lock and status
      const claimed = await tx.parseJob.update({
        where: { id: candidate.id },
        data: {
          status: "running",
          workerId,
          lockedAt: now,
          lockExpiry,
          startedAt: candidate.startedAt ?? now,
        },
      });

      return claimed;
    });

    if (job) {
      jobLogger.info({
        event: "job.claimed",
        jobId: job.id,
        workerId,
      }, "Job claimed by worker");
    }

    return job;
  }

  /**
   * Renew the lock on a job (heartbeat)
   * Returns false if lock was lost (job reassigned or cancelled)
   */
  async renewLock(jobId: string, workerId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);

    const result = await prisma.parseJob.updateMany({
      where: {
        id: jobId,
        workerId,
        status: "running",
      },
      data: {
        lockExpiry,
      },
    });

    const renewed = result.count > 0;
    if (!renewed) {
      jobLogger.warn({
        event: "job.lock_renewal_failed",
        jobId,
        workerId,
      }, "Failed to renew lock");
    }

    return renewed;
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, data: JobUpdateData): Promise<void> {
    await prisma.parseJob.update({
      where: { id: jobId },
      data,
    });
  }

  /**
   * Complete a job (success or failure)
   */
  async complete(jobId: string, workerId: string, result: JobResult): Promise<void> {
    const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
    if (!job) {
      jobLogger.warn({ event: "job.not_found", jobId }, "Job not found for completion");
      return;
    }

    // Validate transition
    assertTransition(job.status, result.status);

    await prisma.parseJob.update({
      where: {
        id: jobId,
        workerId, // Ensure only the worker that claimed it can complete it
      },
      data: {
        status: result.status,
        playbookId: result.playbookId,
        completedAt: new Date(),
        failureReason: result.failureReason,
        progress: result.status === "completed" ? 100 : job.progress,
        // Release lock
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });

    jobLogger.info({
      event: "job.completed",
      jobId,
      workerId,
      status: result.status,
      playbookId: result.playbookId,
    }, "Job completed");
  }

  /**
   * Pause a running job
   */
  async pause(jobId: string): Promise<void> {
    const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    assertTransition(job.status, "paused");

    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "paused",
        // Keep lock for resume
      },
    });

    jobLogger.info({ event: "job.paused", jobId }, "Job paused");
  }

  /**
   * Resume a paused job
   */
  async resume(jobId: string): Promise<void> {
    const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    assertTransition(job.status, "running");

    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "queued", // Re-queue for worker pickup
        // Release lock so it can be claimed
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });

    jobLogger.info({ event: "job.resumed", jobId }, "Job resumed and re-queued");
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<void> {
    const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    assertTransition(job.status, "cancelled");

    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        completedAt: new Date(),
        // Release lock
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });

    jobLogger.info({ event: "job.cancelled", jobId }, "Job cancelled");
  }
}

/**
 * Handle job failure with retry logic
 */
export async function handleFailure(jobId: string, error: Error): Promise<void> {
  const job = await prisma.parseJob.findUnique({ where: { id: jobId } });
  if (!job) {
    jobLogger.warn({ event: "job.not_found", jobId }, "Job not found for failure handling");
    return;
  }

  const shouldRetry = job.retryCount < job.maxRetries;

  if (shouldRetry) {
    // Calculate exponential backoff delay (but don't actually delay, just increment count)
    const delayMs = Math.min(1000 * 2 ** job.retryCount, 60000);
    jobLogger.warn({
      event: "job.retry",
      jobId,
      attempt: job.retryCount + 1,
      maxRetries: job.maxRetries,
      backoffMs: delayMs,
      error: error.message,
    }, "Job failed, will retry");

    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "retrying",
        retryCount: job.retryCount + 1,
        lastError: error.message,
        // Release lock for retry
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });

    // Re-queue after short delay
    setTimeout(async () => {
      const currentJob = await prisma.parseJob.findUnique({ where: { id: jobId } });
      if (currentJob?.status === "retrying") {
        await prisma.parseJob.update({
          where: { id: jobId },
          data: { status: "queued" },
        });
        jobLogger.info({ event: "job.requeued", jobId }, "Job re-queued for retry");
      }
    }, delayMs);
  } else {
    // Max retries exceeded, mark as failed
    jobLogger.error({
      event: "job.failed_permanently",
      jobId,
      maxRetries: job.maxRetries,
      error: error.message,
      stack: error.stack,
    }, "Job failed permanently after max retries");

    await prisma.parseJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        failureReason: `Max retries (${job.maxRetries}) exceeded. Last error: ${error.message}`,
        lastError: error.message,
        completedAt: new Date(),
        // Release lock
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });
  }
}
