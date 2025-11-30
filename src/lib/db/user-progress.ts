import { prisma } from './prisma';

/**
 * User progress tracking functions for practice mode
 */

const DEFAULT_USER_ID = 'default-user';

/**
 * Get or create user line progress
 */
export async function getUserLineProgress(
    lineId: string,
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    let progress = await prisma.userLineProgress.findUnique({
        where: {
            userId_lineId_characterId: {
                userId,
                lineId,
                characterId,
            },
        },
    });

    if (!progress) {
        // Get the playbook ID from the line
        const line = await prisma.line.findUnique({
            where: { id: lineId },
            include: {
                scene: {
                    include: {
                        act: {
                            select: { playbookId: true },
                        },
                    },
                },
            },
        });

        if (!line) {
            throw new Error(`Line ${lineId} not found`);
        }

        progress = await prisma.userLineProgress.create({
            data: {
                userId,
                lineId,
                characterId,
                playbookId: line.scene.act.playbookId,
                rehearsalCount: 0,
                hintCount: 0,
                progressPercent: 0,
            },
        });
    }

    return progress;
}

/**
 * Update user line progress after practice
 */
export async function updateLineProgress(
    lineId: string,
    characterId: string,
    updates: {
        incrementRehearsalCount?: boolean;
        incrementHintCount?: boolean;
        progressPercent?: number;
    },
    userId: string = DEFAULT_USER_ID
) {
    const progress = await getUserLineProgress(lineId, characterId, userId);

    return await prisma.userLineProgress.update({
        where: { id: progress.id },
        data: {
            rehearsalCount: updates.incrementRehearsalCount
                ? { increment: 1 }
                : undefined,
            hintCount: updates.incrementHintCount ? { increment: 1 } : undefined,
            progressPercent: updates.progressPercent,
            lastPracticedAt: new Date(),
        },
    });
}

/**
 * Get all line progress for a character
 */
export async function getCharacterLineProgress(
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    return await prisma.userLineProgress.findMany({
        where: {
            userId,
            characterId,
        },
        include: {
            line: {
                select: {
                    id: true,
                    text: true,
                    type: true,
                    order: true,
                    scene: {
                        select: {
                            id: true,
                            title: true,
                            act: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { line: { scene: { act: { order: 'asc' } } } },
            { line: { scene: { order: 'asc' } } },
            { line: { order: 'asc' } },
        ],
    });
}

/**
 * Get all line progress for a play
 */
export async function getPlayLineProgress(
    playbookId: string,
    userId: string = DEFAULT_USER_ID
) {
    return await prisma.userLineProgress.findMany({
        where: {
            userId,
            playbookId,
        },
        include: {
            line: {
                select: {
                    id: true,
                    text: true,
                    type: true,
                },
            },
            character: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            lastPracticedAt: 'desc',
        },
    });
}


/**
 * Get or create character progress summary
 */
export async function getCharacterProgress(
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    let progress = await prisma.userCharacterProgress.findUnique({
        where: {
            userId_characterId: {
                userId,
                characterId,
            },
        },
    });

    if (!progress) {
        // Get the playbook ID and count total lines for the character
        const character = await prisma.character.findUnique({
            where: { id: characterId },
            include: {
                lines: {
                    select: {
                        lineId: true,
                    },
                },
            },
        });

        if (!character) {
            throw new Error(`Character ${characterId} not found`);
        }

        progress = await prisma.userCharacterProgress.create({
            data: {
                userId,
                characterId,
                playbookId: character.playbookId,
                totalLines: character.lines.length,
                masteredLines: 0,
            },
        });
    }

    return progress;
}

/**
 * Update character progress summary
 */
export async function updateCharacterProgress(
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    const progress = await getCharacterProgress(characterId, userId);

    // Count mastered lines (high mastery level)
    const lineProgress = await prisma.userLineProgress.findMany({
        where: {
            userId,
            characterId,
        },
    });

    const masteredLines = lineProgress.filter(
        (lp) => calculateMasteryLevel(lp.rehearsalCount, lp.progressPercent) === 'high'
    ).length;

    return await prisma.userCharacterProgress.update({
        where: { id: progress.id },
        data: {
            masteredLines,
            lastPracticedAt: new Date(),
        },
    });
}

/**
 * Get practice statistics for a play
 */
export async function getPlayPracticeStats(
    playbookId: string,
    userId: string = DEFAULT_USER_ID
) {
    const [characterProgress, lineProgress] = await Promise.all([
        prisma.userCharacterProgress.findMany({
            where: {
                userId,
                playbookId,
            },
            include: {
                character: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }),
        prisma.userLineProgress.findMany({
            where: {
                userId,
                playbookId,
            },
        }),
    ]);

    const totalLines = lineProgress.length;
    const totalRehearsals = lineProgress.reduce((sum, lp) => sum + lp.rehearsalCount, 0);
    const totalHints = lineProgress.reduce((sum, lp) => sum + lp.hintCount, 0);
    const averageProgress =
        totalLines > 0
            ? lineProgress.reduce((sum, lp) => sum + lp.progressPercent, 0) / totalLines
            : 0;

    const masteryDistribution = lineProgress.reduce(
        (acc, lp) => {
            const level = calculateMasteryLevel(lp.rehearsalCount, lp.progressPercent);
            acc[level]++;
            return acc;
        },
        { low: 0, medium: 0, high: 0 }
    );

    return {
        playbookId,
        totalLines,
        totalRehearsals,
        totalHints,
        averageProgress,
        masteryDistribution,
        characterProgress: characterProgress.map((cp) => ({
            characterId: cp.characterId,
            characterName: cp.character.name,
            totalLines: cp.totalLines,
            masteredLines: cp.masteredLines,
            completionRate: cp.totalLines > 0 ? (cp.masteredLines / cp.totalLines) * 100 : 0,
            lastPracticedAt: cp.lastPracticedAt,
        })),
    };
}

/**
 * Reset progress for a line
 */
export async function resetLineProgress(
    lineId: string,
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    return await prisma.userLineProgress.updateMany({
        where: {
            userId,
            lineId,
            characterId,
        },
        data: {
            rehearsalCount: 0,
            hintCount: 0,
            progressPercent: 0,
        },
    });
}

/**
 * Reset all progress for a character
 */
export async function resetCharacterProgress(
    characterId: string,
    userId: string = DEFAULT_USER_ID
) {
    await prisma.userLineProgress.deleteMany({
        where: {
            userId,
            characterId,
        },
    });

    await prisma.userCharacterProgress.deleteMany({
        where: {
            userId,
            characterId,
        },
    });
}

export function calculateMasteryLevel(
    rehearsalCount: number,
    progressPercent: number
): 'low' | 'medium' | 'high' {
    if (progressPercent >= 80 && rehearsalCount >= 5) {
        return 'high';
    } else if (progressPercent >= 50 && rehearsalCount >= 2) {
        return 'medium';
    } else {
        return 'low';
    }
}