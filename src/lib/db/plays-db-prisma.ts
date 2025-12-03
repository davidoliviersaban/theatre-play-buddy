import { prisma } from './prisma';
import type { Playbook } from '../play/schemas';
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
    // Build character name-to-ID mapping after creation (for line attribution)
    // We'll create characters first, then reference them by the DB-generated IDs

    // Create the playbook with all nested entities, letting Prisma generate all IDs
    const createdPlaybook = await prisma.playbook.create({
        data: {
            title: play.title,
            author: play.author,
            year: play.year,
            genre: play.genre,
            description: play.description,
            llmSourceId: (play as unknown as { llmSourceId?: string }).llmSourceId ?? undefined,
            characters: {
                create: play.characters.map(char => ({
                    name: char.name,
                    description: char.description,
                    llmSourceId: char.id, // Store LLM's ID as llmSourceId for mapping
                })),
            },
        },
        include: {
            characters: true,
        },
    });

    // Build mapping from LLM character ID to DB character ID
    const charIdMap = new Map<string, string>();
    for (const char of play.characters) {
        // Use LLM ID if provided, otherwise fall back to character name
        const lookupKey = char.id || char.name;
        const dbChar = createdPlaybook.characters.find(c =>
            (char.id && c.llmSourceId === char.id) || c.name === char.name
        );
        if (dbChar) {
            charIdMap.set(lookupKey, dbChar.id);
        }
    }

    // Now create acts, scenes, and lines
    for (const [actIndex, act] of play.acts.entries()) {
        const createdAct = await prisma.act.create({
            data: {
                title: act.title,
                order: actIndex,
                playbookId: createdPlaybook.id,
                llmSourceId: act.id,
            },
        });

        for (const [sceneIndex, scene] of act.scenes.entries()) {
            const createdScene = await prisma.scene.create({
                data: {
                    title: scene.title,
                    order: sceneIndex,
                    actId: createdAct.id,
                    llmSourceId: scene.id,
                },
            });

            for (const [lineIndex, line] of scene.lines.entries()) {
                const createdLine = await prisma.line.create({
                    data: {
                        text: line.text,
                        type: line.type,
                        order: lineIndex,
                        sceneId: createdScene.id,
                        llmSourceId: line.id,
                        indentLevel: line.formatting?.indentLevel,
                        preserveLineBreaks: line.formatting?.preserveLineBreaks,
                    },
                });

                // Create character attributions
                const charIds: string[] = [];
                if (line.characterId) {
                    const dbCharId = charIdMap.get(line.characterId);
                    if (dbCharId) charIds.push(dbCharId);
                } else if (line.characterIdArray) {
                    for (const llmCharId of line.characterIdArray) {
                        const dbCharId = charIdMap.get(llmCharId);
                        if (dbCharId) charIds.push(dbCharId);
                    }
                }

                if (charIds.length > 0) {
                    await prisma.lineCharacter.createMany({
                        data: charIds.map((charId, i) => ({
                            lineId: createdLine.id,
                            characterId: charId,
                            order: i,
                        })),
                    });
                }
            }
        }
    }

    console.log(`[DB] ✅ Created play: ${createdPlaybook.id} (${play.title})`);
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
