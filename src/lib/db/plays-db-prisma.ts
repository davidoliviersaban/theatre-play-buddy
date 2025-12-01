import { prisma } from './prisma';
import type { Playbook } from '../parse/schemas';
import type { PlayMetadata } from '../types';

// Re-export PlayMetadata for convenience
export type { PlayMetadata };

/**
 * Get metadata for a single play by ID (without loading full play data)
 */
export async function getPlayMetadataById(playId: string): Promise<PlayMetadata | null> {
    const play = await prisma.playbook.findUnique({
        where: { id: playId },
        select: {
            id: true,
            title: true,
            author: true,
            genre: true,
            year: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    characters: true,
                    acts: true,
                },
            },
        },
    });

    if (!play) {
        return null;
    }

    // Count total lines across all acts and scenes
    const lineCount = await prisma.line.count({
        where: {
            scene: {
                act: {
                    playbookId: playId,
                },
            },
        },
    });

    return {
        id: play.id,
        title: play.title,
        author: play.author,
        genre: play.genre ?? 'Unknown',
        year: play.year ?? 0,
        createdAt: play.createdAt.toISOString(),
        updatedAt: play.updatedAt.toISOString(),
        characterCount: play._count.characters,
        actCount: play._count.acts,
        lineCount,
    };
}

/**
 * Save a play to the database
 */
export async function savePlay(play: Playbook): Promise<void> {
    // Check if play exists
    const existingPlay = await prisma.playbook.findUnique({
        where: { id: play.id },
    });

    if (existingPlay) {
        // Update existing play - delete and recreate for simplicity
        await prisma.playbook.delete({
            where: { id: play.id },
        });
    }

    // Create new play with all nested data
    await prisma.playbook.create({
        data: {
            id: play.id,
            title: play.title,
            author: play.author,
            year: play.year,
            genre: play.genre,
            description: play.description,
            // coverImage: play.coverImage,
            characters: {
                create: play.characters.map(char => ({
                    id: char.id,
                    name: char.name,
                    description: char.description,
                })),
            },
            acts: {
                create: play.acts.map((act, actIndex) => ({
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
                                    indentLevel: line.formatting?.indentLevel,
                                    preserveLineBreaks: line.formatting?.preserveLineBreaks,
                                    // Handle character relationship
                                    characters: line.characterId
                                        ? {
                                              create: {
                                                  characterId: line.characterId,
                                                  order: 0,
                                              },
                                          }
                                        : line.characterIdArray
                                        ? {
                                              create: line.characterIdArray.map((charId, i) => ({
                                                  characterId: charId,
                                                  order: i,
                                              })),
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

    console.log(`[DB] Saved play: ${play.id} (${existingPlay ? 'updated' : 'created'})`);
}

/**
 * Get a play by ID
 */
export async function getPlayById(playId: string): Promise<Playbook | null> {
    const play = await prisma.playbook.findUnique({
        where: { id: playId },
        include: {
            characters: {
                orderBy: { createdAt: 'asc' },
            },
            acts: {
                orderBy: { order: 'asc' },
                include: {
                    scenes: {
                        orderBy: { order: 'asc' },
                        include: {
                            lines: {
                                orderBy: { order: 'asc' },
                                include: {
                                    characters: {
                                        orderBy: { order: 'asc' },
                                        select: {
                                            characterId: true,
                                            order: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!play) {
        return null;
    }

    // Transform Prisma model to Playbook format
    return {
        id: play.id,
        title: play.title,
        author: play.author,
        year: play.year ?? 0,
        genre: play.genre ?? 'Unknown',
        description: play.description ?? '',
        characters: play.characters.map(char => ({
            id: char.id,
            name: char.name,
            description: char.description ?? undefined,
        })),
        acts: play.acts.map(act => ({
            id: act.id,
            title: act.title,
            scenes: act.scenes.map(scene => ({
                id: scene.id,
                title: scene.title,
                lines: scene.lines.map(line => {
                    const characterIds = line.characters.map(lc => lc.characterId);
                    return {
                        id: line.id,
                        text: line.text,
                        type: line.type as 'dialogue' | 'stage_direction',
                        characterId: characterIds.length === 1 ? characterIds[0] : undefined,
                        characterIdArray: characterIds.length > 1 ? characterIds : undefined,
                        formatting:
                            line.indentLevel !== null || line.preserveLineBreaks !== null
                                ? {
                                      indentLevel: line.indentLevel ?? undefined,
                                      preserveLineBreaks: line.preserveLineBreaks ?? undefined,
                                  }
                                : undefined,
                    };
                }),
            })),
        })),
    };
}

/**
 * Get all plays metadata (lightweight list)
 */
export async function getAllPlays(): Promise<PlayMetadata[]> {
    const plays = await prisma.playbook.findMany({
        select: {
            id: true,
            title: true,
            author: true,
            genre: true,
            year: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    characters: true,
                    acts: true,
                },
            },
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });

    // Get line counts for all plays
    const playsWithLineCounts = await Promise.all(
        plays.map(async (play) => {
            const lineCount = await prisma.line.count({
                where: {
                    scene: {
                        act: {
                            playbookId: play.id,
                        },
                    },
                },
            });

            return {
                id: play.id,
                title: play.title,
                author: play.author,
                genre: play.genre ?? 'Unknown',
                year: play.year ?? 0,
                createdAt: play.createdAt.toISOString(),
                updatedAt: play.updatedAt.toISOString(),
                characterCount: play._count.characters,
                actCount: play._count.acts,
                lineCount,
            };
        })
    );

    return playsWithLineCounts;
}

/**
 * Update play metadata in the database
 * Note: This only updates top-level playbook fields
 */
export async function updatePlayMetadata(
    playId: string,
    updates: Partial<Omit<PlayMetadata, 'id' | 'createdAt'>>
): Promise<PlayMetadata | null> {
    try {
        const updated = await prisma.playbook.update({
            where: { id: playId },
            data: {
                title: updates.title,
                author: updates.author,
                genre: updates.genre,
                year: updates.year,
            },
            select: {
                id: true,
                title: true,
                author: true,
                genre: true,
                year: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        characters: true,
                        acts: true,
                    },
                },
            },
        });

        const lineCount = await prisma.line.count({
            where: {
                scene: {
                    act: {
                        playbookId: playId,
                    },
                },
            },
        });

        console.log(`[DB] Updated metadata for play: ${playId}`);

        return {
            id: updated.id,
            title: updated.title,
            author: updated.author,
            genre: updated.genre ?? 'Unknown',
            year: updated.year ?? 0,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            characterCount: updated._count.characters,
            actCount: updated._count.acts,
            lineCount,
        };
    } catch (err) {
        console.error(`Failed to update metadata for play ${playId}:`, err);
        return null;
    }
}

/**
 * Delete a play
 */
export async function deletePlay(playId: string): Promise<boolean> {
    try {
        await prisma.playbook.delete({
            where: { id: playId },
        });

        console.log(`[DB] Deleted play: ${playId}`);
        return true;
    } catch {
        // Play not found
        return false;
    }
}

/**
 * Search plays by title or author
 */
export async function searchPlays(query: string): Promise<PlayMetadata[]> {
    const plays = await prisma.playbook.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { author: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            title: true,
            author: true,
            genre: true,
            year: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    characters: true,
                    acts: true,
                },
            },
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });

    const playsWithLineCounts = await Promise.all(
        plays.map(async (play) => {
            const lineCount = await prisma.line.count({
                where: {
                    scene: {
                        act: {
                            playbookId: play.id,
                        },
                    },
                },
            });

            return {
                id: play.id,
                title: play.title,
                author: play.author,
                genre: play.genre ?? 'Unknown',
                year: play.year ?? 0,
                createdAt: play.createdAt.toISOString(),
                updatedAt: play.updatedAt.toISOString(),
                characterCount: play._count.characters,
                actCount: play._count.acts,
                lineCount,
            };
        })
    );

    return playsWithLineCounts;
}

/**
 * Get database statistics
 */
export async function getDbStats(): Promise<{
    totalPlays: number;
    totalCharacters: number;
    totalLines: number;
    lastUpdated: string;
}> {
    const [totalPlays, totalCharacters, totalLines, latestPlay] = await Promise.all([
        prisma.playbook.count(),
        prisma.character.count(),
        prisma.line.count(),
        prisma.playbook.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
        }),
    ]);

    return {
        totalPlays,
        totalCharacters,
        totalLines,
        lastUpdated: latestPlay?.updatedAt.toISOString() ?? new Date().toISOString(),
    };
}

/**
 * Check if a play exists
 */
export async function playExists(playId: string): Promise<boolean> {
    const count = await prisma.playbook.count({
        where: { id: playId },
    });
    return count > 0;
}
