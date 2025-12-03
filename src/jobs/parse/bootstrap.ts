/**
 * Worker Bootstrap
 * Starts and manages worker pool on application initialization
 */

import { JobWorker } from "@/jobs/worker";

let workers: JobWorker[] = [];
let shutdownInProgress = false;

/**
 * Start worker pool
 */
export function startWorkers(count: number = 2): JobWorker[] {
  if (workers.length > 0) {
    console.warn("[Bootstrap] Workers already started, skipping...");
    return workers;
  }

  console.log(`[Bootstrap] Starting ${count} workers...`);

  for (let i = 0; i < count; i++) {
    const workerId = `worker-${i}-${process.pid}`;
    const worker = new JobWorker(workerId);
    workers.push(worker);

    // Start worker in background
    worker.start().catch((error) => {
      console.error(`[Bootstrap] Worker ${workerId} crashed:`, error);
    });
  }

  // Register graceful shutdown handlers
  registerShutdownHandlers();

  console.log(`[Bootstrap] Started ${workers.length} workers`);
  return workers;
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  if (shutdownInProgress) {
    console.log("[Bootstrap] Shutdown already in progress...");
    return;
  }

  shutdownInProgress = true;
  console.log(`[Bootstrap] Stopping ${workers.length} workers...`);

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
  console.log("[Bootstrap] All workers stopped");
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
    console.log(`[Bootstrap] Received ${signal}, initiating graceful shutdown...`);
    await stopWorkers();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
