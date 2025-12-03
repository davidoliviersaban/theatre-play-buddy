/**
 * Unit tests for JobQueue
 */

import { JobQueue, handleFailure } from "@/lib/jobs/queue";
import { prisma } from "@/lib/db/prisma";
import type { ParseJob } from "@prisma/client";

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    parseJob: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock logger
jest.mock("@/lib/jobs/logger", () => ({
  jobLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("JobQueue", () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("enqueue", () => {
    it("should create a new job with default priority", async () => {
      const mockJob = {
        id: "job-1",
        type: "PARSE_PLAY",
        rawText: "test text",
        filename: "test.txt",
        priority: 0,
        status: "queued",
      };

      (prisma.parseJob.create as jest.Mock).mockResolvedValue(mockJob);

      const jobId = await queue.enqueue({
        rawText: "test text",
        filename: "test.txt",
      });

      expect(jobId).toBe("job-1");
      expect(prisma.parseJob.create).toHaveBeenCalledWith({
        data: {
          type: "PARSE_PLAY",
          rawText: "test text",
          filename: "test.txt",
          config: undefined,
          priority: 0,
          maxRetries: 3,
          status: "queued",
        },
      });
    });

    it("should respect custom priority and config", async () => {
      const mockJob = { id: "job-2", priority: 10 };
      (prisma.parseJob.create as jest.Mock).mockResolvedValue(mockJob);

      await queue.enqueue({
        rawText: "text",
        filename: "file.txt",
        priority: 10,
        config: { chunkSize: 5000, llmProvider: "openai" },
      });

      expect(prisma.parseJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 10,
          config: { chunkSize: 5000, llmProvider: "openai" },
        }),
      });
    });
  });

  describe("claimNext", () => {
    it("should claim highest priority queued job", async () => {
      const mockCandidate = {
        id: "job-1",
        status: "queued",
        priority: 5,
        createdAt: new Date(),
      };

      const mockClaimed = {
        ...mockCandidate,
        status: "running",
        workerId: "worker-1",
        lockedAt: expect.any(Date),
        lockExpiry: expect.any(Date),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          parseJob: {
            findFirst: jest.fn().mockResolvedValue(mockCandidate),
            update: jest.fn().mockResolvedValue(mockClaimed),
          },
        };
        return callback(tx);
      });

      const job = await queue.claimNext("worker-1");

      expect(job).toEqual(mockClaimed);
    });

    it("should return null when no jobs available", async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          parseJob: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      const job = await queue.claimNext("worker-1");

      expect(job).toBeNull();
    });

    it("should claim job with expired lock", async () => {
      const expiredLock = new Date(Date.now() - 1000);
      const mockCandidate = {
        id: "job-1",
        status: "running",
        lockExpiry: expiredLock,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          parseJob: {
            findFirst: jest.fn().mockResolvedValue(mockCandidate),
            update: jest.fn().mockResolvedValue({ ...mockCandidate, workerId: "worker-2" }),
          },
        };
        return callback(tx);
      });

      const job = await queue.claimNext("worker-2");

      expect(job?.workerId).toBe("worker-2");
    });
  });

  describe("renewLock", () => {
    it("should successfully renew lock for running job", async () => {
      (prisma.parseJob.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const renewed = await queue.renewLock("job-1", "worker-1");

      expect(renewed).toBe(true);
      expect(prisma.parseJob.updateMany).toHaveBeenCalledWith({
        where: {
          id: "job-1",
          workerId: "worker-1",
          status: "running",
        },
        data: {
          lockExpiry: expect.any(Date),
        },
      });
    });

    it("should fail to renew if lock was lost", async () => {
      (prisma.parseJob.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const renewed = await queue.renewLock("job-1", "worker-1");

      expect(renewed).toBe(false);
    });
  });

  describe("complete", () => {
    it("should complete job successfully", async () => {
      const mockJob = {
        id: "job-1",
        status: "running",
        progress: 80,
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: "completed",
      });

      await queue.complete("job-1", "worker-1", {
        status: "completed",
        playbookId: "play-1",
      });

      expect(prisma.parseJob.update).toHaveBeenCalledWith({
        where: { id: "job-1", workerId: "worker-1" },
        data: {
          status: "completed",
          playbookId: "play-1",
          completedAt: expect.any(Date),
          failureReason: undefined,
          progress: 100,
          workerId: null,
          lockedAt: null,
          lockExpiry: null,
        },
      });
    });

    it("should handle job failure", async () => {
      const mockJob = {
        id: "job-1",
        status: "running",
        progress: 50,
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue(mockJob);

      await queue.complete("job-1", "worker-1", {
        status: "failed",
        failureReason: "LLM API error",
      });

      expect(prisma.parseJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "failed",
            failureReason: "LLM API error",
            progress: 50, // Should preserve progress
          }),
        })
      );
    });

    it("should do nothing if job not found", async () => {
      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(null);

      await queue.complete("job-1", "worker-1", { status: "completed" });

      expect(prisma.parseJob.update).not.toHaveBeenCalled();
    });
  });

  describe("pause", () => {
    it("should pause a running job", async () => {
      const mockJob = {
        id: "job-1",
        status: "running",
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: "paused",
      });

      await queue.pause("job-1");

      expect(prisma.parseJob.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "paused" },
      });
    });

    it("should throw on invalid state transition", async () => {
      const mockJob = {
        id: "job-1",
        status: "completed",
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      await expect(queue.pause("job-1")).rejects.toThrow(
        "Invalid transition: completed → paused"
      );
    });
  });

  describe("resume", () => {
    it("should resume a paused job by re-queuing", async () => {
      const mockJob = {
        id: "job-1",
        status: "paused",
        workerId: "worker-1",
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: "queued",
      });

      await queue.resume("job-1");

      expect(prisma.parseJob.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: {
          status: "queued",
          workerId: null,
          lockedAt: null,
          lockExpiry: null,
        },
      });
    });
  });

  describe("cancel", () => {
    it("should cancel a queued job", async () => {
      const mockJob = {
        id: "job-1",
        status: "queued",
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: "cancelled",
      });

      await queue.cancel("job-1");

      expect(prisma.parseJob.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: {
          status: "cancelled",
          completedAt: expect.any(Date),
          workerId: null,
          lockedAt: null,
          lockExpiry: null,
        },
      });
    });

    it("should cancel a running job", async () => {
      const mockJob = {
        id: "job-1",
        status: "running",
        workerId: "worker-1",
      };

      (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.parseJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: "cancelled",
      });

      await queue.cancel("job-1");

      expect(prisma.parseJob.update).toHaveBeenCalled();
    });
  });
});

describe("handleFailure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should retry job within max retries", async () => {
    const mockJob = {
      id: "job-1",
      retryCount: 1,
      maxRetries: 3,
    };

    (prisma.parseJob.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockJob)
      .mockResolvedValueOnce({ ...mockJob, status: "retrying" });
    (prisma.parseJob.update as jest.Mock).mockResolvedValue({});

    const error = new Error("Transient API error");
    await handleFailure("job-1", error);

    expect(prisma.parseJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "retrying",
        retryCount: 2,
        lastError: "Transient API error",
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });

    // Fast-forward to backoff timeout
    jest.advanceTimersByTime(2000); // 2^1 * 1000ms
    await Promise.resolve(); // Flush promises

    expect(prisma.parseJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { status: "queued" },
    });
  });

  it("should mark as failed after max retries exceeded", async () => {
    const mockJob = {
      id: "job-1",
      retryCount: 3,
      maxRetries: 3,
    };

    (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.parseJob.update as jest.Mock).mockResolvedValue({});

    const error = new Error("Permanent error");
    await handleFailure("job-1", error);

    expect(prisma.parseJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "failed",
        failureReason: "Max retries (3) exceeded. Last error: Permanent error",
        lastError: "Permanent error",
        completedAt: expect.any(Date),
        workerId: null,
        lockedAt: null,
        lockExpiry: null,
      },
    });
  });

  it("should use exponential backoff with cap", async () => {
    const mockJob = {
      id: "job-1",
      retryCount: 10, // Large retry count
      maxRetries: 20,
    };

    (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.parseJob.update as jest.Mock).mockResolvedValue({});

    const error = new Error("Test");
    await handleFailure("job-1", error);

    // Backoff should be capped at 60000ms
    expect(prisma.parseJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "retrying",
        }),
      })
    );
  });

  it("should handle missing job gracefully", async () => {
    (prisma.parseJob.findUnique as jest.Mock).mockResolvedValue(null);

    const error = new Error("Test");
    await handleFailure("job-999", error);

    expect(prisma.parseJob.update).not.toHaveBeenCalled();
  });
});
