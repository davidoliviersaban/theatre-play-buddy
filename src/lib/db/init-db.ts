import { savePlay, getAllPlays } from './plays-db';
import type { Playbook } from '../parse/schemas';
import { MOCK_PLAYS } from '../mock-data';
let initializationStarted = false;

/**
 * Initialize the database with mock data if it's empty
 * This runs automatically at server startup
 */
export async function initializeDatabase(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (initializationStarted) {
        console.log('[DB Init] Initialization already in progress, skipping...');
        return;
    }

    initializationStarted = true;

    try {
        console.log('[DB Init] Checking database state...');
        const existingPlays = await getAllPlays();

        if (existingPlays.length > MOCK_PLAYS.length) {
            console.log(`[DB Init] Database already contains ${existingPlays.length} plays, skipping initialization`);
            return;
        }

        console.log('[DB Init] Database is empty, initializing with mock data...');

        for (const mockPlay of MOCK_PLAYS) {
            try {
                await savePlay(mockPlay as Playbook);
                console.log(`[DB Init] ✓ Saved: ${mockPlay.title}`);
            } catch (error) {
                console.error(`[DB Init] ✗ Failed to save ${mockPlay.title}:`, error);
            }
        }

        const finalCount = await getAllPlays();
        console.log(`[DB Init] ✅ Initialization complete! Database now contains ${finalCount.length} plays`);
    } catch (error) {
        console.error('[DB Init] ❌ Database initialization failed:', error);
    } finally {
        initializationStarted = false;
    }
}
