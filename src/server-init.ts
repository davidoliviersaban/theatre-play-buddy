/**
 * Server initialization script
 * This file is imported at the top level to ensure database initialization
 * runs when the Next.js server starts
 */

import { initializeDatabase } from './lib/db/init-db';

// Initialize database with mock data if empty
if (typeof window === 'undefined') {
    // Only run on server-side
    initializeDatabase().catch(error => {
        console.error('[Server Init] Failed to initialize database:', error);
    });
}
