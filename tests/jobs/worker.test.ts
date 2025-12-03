/**
 * Unit tests for JobWorker
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { JobWorker } from "@/jobs/worker";
import { JobQueue } from "@/jobs/queue";
import { parseJobPipeline } from "@/jobs/parse/parse-pipeline";

// Mock dependencies
jest.mock("@/jobs/queue");
jest.mock("@/jobs/parse/parse-pipeline");
jest.mock("@/jobs/parse/logger", () => ({
  workerLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("JobWorker", () => {
  let worker: JobWorker;
  let mockQueue: jest.Mocked<JobQueue>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockQueue = {
      claimNext: jest.fn(),
      renewLock: jest.fn(),
      complete: jest.fn(),
      updateProgress: jest.fn(),
    } as any;

    (JobQueue as jest.MockedClass<typeof JobQueue>).mockImplementation(
      () => mockQueue
    );

    worker = new JobWorker("worker-test-1");
  });

  afterEach(async () => {
    await worker.stop();
    jest.useRealTimers();
  });

  describe("start", () => {
    it("should poll queue and process jobs", async () => {
      const mockJob = {
        id: "job-1",
        rawText: "test text",
        filename: "test.txt",
        config: {},
        status: "running",
      };

      mockQueue.claimNext
        .mockResolvedValueOnce(mockJob as any)
        .mockResolvedValue(null);

      (parseJobPipeline as jest.Mock).mockResolvedValue({
        status: "completed",
        playbookId: "play-1",
      });

      mockQueue.renewLock.mockResolvedValue(true);

      // Start worker in background
      void worker.start();

      // Wait for first job to be claimed
      await jest.advanceTimersByTimeAsync(100);

      // Stop worker
      await worker.stop();

      expect(mockQueue.claimNext).toHaveBeenCalled();
      expect(parseJobPipeline).toHaveBeenCalledWith(
        mockJob,
        expect.any(Function)
      );
      expect(mockQueue.complete).toHaveBeenCalledWith("job-1", "worker-test-1", {
        status: "completed",
        playbookId: "play-1",
      });
    });

    it("should wait when no jobs available", async () => {
      mockQueue.claimNext.mockResolvedValue(null);

      void worker.start();

      // Advance time but not enough for multiple polls
      jest.advanceTimersByTime(3000);
      await Promise.resolve();

      await worker.stop();

      // Should have polled at least once
      expect(mockQueue.claimNext).toHaveBeenCalled();
    });

    it("should start heartbeat when processing job", async () => {
      const mockJob = {
        id: "job-1",
        rawText: "test",
        filename: "test.txt",
      };

      mockQueue.claimNext.mockResolvedValueOnce(mockJob as any);
      mockQueue.renewLock.mockResolvedValue(true);

      (parseJobPipeline as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ status: "completed" }), 120000);
          })
      );

      // Start worker
      void worker.start();

      // Wait for job to be claimed
      await jest.advanceTimersByTimeAsync(100);

      // Advance past heartbeat interval
      await jest.advanceTimersByTimeAsync(60000);

      // Should have renewed lock
      expect(mockQueue.renewLock).toHaveBeenCalledWith("job-1", "worker-test-1");

      await worker.stop();
    });

    it("should stop when lock renewal fails", async () => {
      const mockJob = {
        id: "job-1",
        rawText: "test",
        filename: "test.txt",
      };

      mockQueue.claimNext.mockResolvedValueOnce(mockJob as any);
      mockQueue.renewLock.mockResolvedValue(false); // Lock lost

      (parseJobPipeline as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 120000))
      );

      worker.start();

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(60000);

      // Worker should have stopped due to lost lock
      expect(mockQueue.renewLock).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle job execution errors", async () => {
      const mockJob = {
        id: "job-1",
        rawText: "test",
        filename: "test.txt",
      };

      mockQueue.claimNext.mockResolvedValueOnce(mockJob as any);
      (parseJobPipeline as jest.Mock).mockRejectedValue(
        new Error("Parsing failed")
      );

      worker.start();

      await jest.advanceTimersByTimeAsync(100);
      await worker.stop();

      // Error should be handled, not crash worker
      expect(parseJobPipeline).toHaveBeenCalled();
    });
  });

  describe("graceful shutdown", () => {
    it("should stop polling after stop() called", async () => {
      mockQueue.claimNext.mockResolvedValue(null);

      worker.start();
      await jest.advanceTimersByTimeAsync(100);

      await worker.stop();

      const callsBefore = mockQueue.claimNext.mock.calls.length;
      await jest.advanceTimersByTimeAsync(10000);

      // Should not poll after stop
      expect(mockQueue.claimNext).toHaveBeenCalledTimes(callsBefore);
    });

    it("should clear heartbeat on shutdown", async () => {
      const mockJob = {
        id: "job-1",
        rawText: "test",
        filename: "test.txt",
      };

      mockQueue.claimNext.mockResolvedValueOnce(mockJob as any);
      mockQueue.renewLock.mockResolvedValue(true);

      (parseJobPipeline as jest.Mock).mockResolvedValue({
        status: "completed",
      });

      worker.start();
      await jest.advanceTimersByTimeAsync(100);
      await worker.stop();

      const renewCallsBefore = mockQueue.renewLock.mock.calls.length;
      await jest.advanceTimersByTimeAsync(120000);

      // Heartbeat should be cleared
      expect(mockQueue.renewLock).toHaveBeenCalledTimes(renewCallsBefore);
    });
  });
});
