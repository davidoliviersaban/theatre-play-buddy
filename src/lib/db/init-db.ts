import { prisma } from './prisma';
import { MOCK_PLAYS } from '../mock-data';
import { savePlay } from './plays-db-prisma';
import type { Playbook } from '../play/schemas';

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
        const existingPlaysCount = await prisma.playbook.count();

        if (existingPlaysCount >= MOCK_PLAYS.length) {
            console.log(`[DB Init] Database already contains ${existingPlaysCount} plays, skipping initialization`);
            return;
        }

        console.log('[DB Init] Database is empty, initializing with mock data...');

        for (const mockPlay of MOCK_PLAYS) {
            try {
                // Convert mock play to Playbook format (IDs become optional llmSourceIds)
                const playbook: Playbook = {
                    title: mockPlay.title,
                    author: mockPlay.author,
                    year: mockPlay.year,
                    genre: mockPlay.genre || 'Drama',
                    description: mockPlay.description || '',
                    characters: mockPlay.characters.map(char => ({
                        id: char.id, // Will be stored as llmSourceId
                        name: char.name,
                        description: char.description,
                    })),
                    acts: mockPlay.acts.map(act => ({
                        id: act.id, // Will be stored as llmSourceId
                        title: act.title,
                        scenes: act.scenes.map(scene => ({
                            id: scene.id, // Will be stored as llmSourceId
                            title: scene.title,
                            lines: scene.lines.map(line => ({
                                id: line.id, // Will be stored as llmSourceId
                                text: line.text,
                                type: line.type as 'dialogue' | 'stage_direction',
                                characterId: line.characterId,
                            })),
                        })),
                    })),
                };

                await savePlay(playbook);
                console.log(`[DB Init] ✓ Saved: ${mockPlay.title}`);
            } catch (error) {
                console.error(`[DB Init] ✗ Failed to save ${mockPlay.title}:`, error);
            }
        }

        const finalCount = await prisma.playbook.count();
        console.log(`[DB Init] ✅ Initialization complete! Database now contains ${finalCount} plays`);
    } catch (error) {
        console.error('[DB Init] ❌ Database initialization failed:', error);
    } finally {
        initializationStarted = false;
    }
}
