/**
 * Worker Bootstrap
 * Starts and manages worker pool on application initialization
 */

import { JobWorker } from "@/jobs/worker";
import { jobLogger } from "@/jobs/logger";

let workers: JobWorker[] = [];
let shutdownInProgress = false;

/**
 * Start worker pool
 */
export function startWorkers(count: number = 2): JobWorker[] {
  if (workers.length > 0) {
    jobLogger.warn({ component: "bootstrap", event: "already_started" }, "[Bootstrap] Workers already started, skipping...");
    return workers;
  }

  jobLogger.info({ component: "bootstrap", event: "start", count }, "[Bootstrap] Starting workers");

  for (let i = 0; i < count; i++) {
    const workerId = `worker-${i}-${process.pid}`;
    const worker = new JobWorker(workerId);
    workers.push(worker);

    // Start worker in background
    worker.start().catch((error) => {
      jobLogger.error({ component: "bootstrap", event: "worker_crashed", workerId, error: String(error) }, "[Bootstrap] Worker crashed");
    });
  }

  // Register graceful shutdown handlers
  registerShutdownHandlers();

  jobLogger.info({ component: "bootstrap", event: "started", count: workers.length }, "[Bootstrap] Started workers");
  return workers;
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  if (shutdownInProgress) {
    jobLogger.warn({ component: "bootstrap", event: "shutdown_in_progress" }, "[Bootstrap] Shutdown already in progress...");
    return;
  }

  shutdownInProgress = true;
  jobLogger.info({ component: "bootstrap", event: "stopping", count: workers.length }, "[Bootstrap] Stopping workers...");

  // Signal all workers to stop
  await Promise.all(workers.map((w) => w.stop()));

  // Give workers time to finish current jobs (max 30 seconds)
  const timeout = 30000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // Check if all workers have stopped (implementation dependent)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  workers = [];
  jobLogger.info({ component: "bootstrap", event: "stopped" }, "[Bootstrap] All workers stopped");
}

/**
 * Get current worker count
 */
export function getWorkerCount(): number {
  return workers.length;
}

/**
 * Register graceful shutdown handlers for SIGTERM and SIGINT
 */
function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    jobLogger.warn({ component: "bootstrap", event: "signal", signal }, "[Bootstrap] Received signal, initiating graceful shutdown...");
    await stopWorkers();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
