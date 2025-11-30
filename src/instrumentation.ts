/**
 * Next.js instrumentation file
 * This runs once when the server starts
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Disabled: Prisma initialization moved to API routes to avoid build-time issues
    // if (process.env.NEXT_RUNTIME === 'nodejs') {
    //     const { initializeDatabase } = await import('./lib/db/init-db');
    //     await initializeDatabase();
    // }
}
