import { prisma } from './prisma';
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
        const existingPlaysCount = await prisma.playbook.count();

        if (existingPlaysCount >= MOCK_PLAYS.length) {
            console.log(`[DB Init] Database already contains ${existingPlaysCount} plays, skipping initialization`);
            return;
        }

        console.log('[DB Init] Database is empty, initializing with mock data...');

        for (const mockPlay of MOCK_PLAYS) {
            try {
                // Create playbook with all nested data
                await prisma.playbook.create({
                    data: {
                        id: mockPlay.id,
                        title: mockPlay.title,
                        author: mockPlay.author,
                        year: mockPlay.year,
                        genre: mockPlay.genre,
                        description: mockPlay.description,
                        coverImage: mockPlay.coverImage,
                        characters: {
                            create: mockPlay.characters.map(char => ({
                                id: char.id,
                                name: char.name,
                                description: char.description,
                                isFavorite: char.isFavorite ?? false,
                                lastSelected: char.lastSelected ?? false,
                                completionRate: char.completionRate ?? 0,
                            })),
                        },
                        acts: {
                            create: mockPlay.acts.map((act, actIndex) => ({
                                id: act.id,
                                title: act.title,
                                order: actIndex,
                                scenes: {
                                    create: act.scenes.map((scene, sceneIndex) => ({
                                        id: scene.id,
                                        title: scene.title,
                                        order: sceneIndex,
                                        lines: {
                                            create: scene.lines.map((line, lineIndex) => ({
                                                id: line.id,
                                                text: line.text,
                                                type: line.type,
                                                order: lineIndex,
                                                masteryLevel: line.masteryLevel,
                                                rehearsalCount: line.rehearsalCount ?? 0,
                                                // Handle character relationship
                                                characters: line.characterId
                                                    ? {
                                                        create: {
                                                            characterId: line.characterId,
                                                            order: 0,
                                                        },
                                                    }
                                                    : undefined,
                                            })),
                                        },
                                    })),
                                },
                            })),
                        },
                    },
                });
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
