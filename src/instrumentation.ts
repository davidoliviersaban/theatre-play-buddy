/**
 * Next.js instrumentation file
 * This runs once when the server starts
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initializeDatabase } = await import('./lib/db/init-db');
        await initializeDatabase();

        // Start background job workers
        const { startWorkers } = await import('./lib/jobs/bootstrap');
        const workerCount = parseInt(process.env.WORKER_COUNT || '2');
        startWorkers(workerCount);
    }
}
