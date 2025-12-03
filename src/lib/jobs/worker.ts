/**
 * Job Worker
 * Polls the job queue and executes parse jobs with heartbeat and graceful shutdown
 */

import { JobQueue, handleFailure } from "../../jobs/queue";
import type { ParseJob } from "@prisma/client";
import { parseJobPipeline } from "../../jobs/parse/parse-pipeline";

/**
 * Sleep utility for polling delays
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const POLL_INTERVAL_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 60_000;

export class JobWorker {
    private workerId: string;
    private queue: JobQueue;
    private running = false;
    private currentJobId: string | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(workerId: string) {
        this.workerId = workerId;
        this.queue = new JobQueue();
    }

    /**
     * Start the worker polling loop
     */
    async start(): Promise<void> {
        this.running = true;
        console.log(`[Worker ${this.workerId}] Started`);

        while (this.running) {
            try {
                // Claim next job from queue
                const job = await this.queue.claimNext(this.workerId);

                if (!job) {
                    // No jobs available, wait before polling again
                    await sleep(POLL_INTERVAL_MS);
                    continue;
                }

                this.currentJobId = job.id;
                console.log(`[Worker ${this.workerId}] Processing job ${job.id} (file: ${job.filename})`);

                // Start heartbeat to renew lock
                this.startHeartbeat(job.id);

                // Execute job
                await this.executeParseJob(job);
            } catch (error) {
                console.error(`[Worker ${this.workerId}] Error:`, error);
                if (this.currentJobId) {
                    await handleFailure(this.currentJobId, error as Error);
                }
            } finally {
                this.stopHeartbeat();
                this.currentJobId = null;
            }
        }

        console.log(`[Worker ${this.workerId}] Stopped`);
    }

    /**
     * Stop the worker (graceful shutdown)
     */
    async stop(): Promise<void> {
        this.running = false;
        console.log(`[Worker ${this.workerId}] Stopping...`);
    }

    /**
     * Start heartbeat to renew job lock
     */
    private startHeartbeat(jobId: string): void {
        this.heartbeatInterval = setInterval(async () => {
            try {
                const renewed = await this.queue.renewLock(jobId, this.workerId);
                if (!renewed) {
                    console.warn(
                        `[Worker ${this.workerId}] Failed to renew lock for job ${jobId} - stopping`
                    );
                    this.stop(); // Lost lock, stop processing
                }
            } catch (error) {
                console.error(`[Worker ${this.workerId}] Heartbeat error:`, error);
            }
        }, HEARTBEAT_INTERVAL_MS); // Every minute
    }

    /**
     * Stop heartbeat interval
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Execute a parse job through the unified pipeline
     */
    private async executeParseJob(job: ParseJob): Promise<void> {
        try {
            // Execute unified parse pipeline with progress callback
            const result = await parseJobPipeline(job, async (progress) => {
                // Update progress in database
                await this.queue.updateProgress(job.id, {
                    progress: progress.progress,
                    completedChunks: progress.chunksCompleted,
                    totalChunks: progress.totalChunks,
                });
            });

            // Mark job as completed
            await this.queue.complete(job.id, this.workerId, result);

            console.log(
                `[Worker ${this.workerId}] Completed job ${job.id} with status: ${result.status}`
            );
        } catch (error) {
            // Error already logged, will be handled in outer catch
            throw error;
        }
    }
}
