import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/progress?playId=X&characterId=Y
 * Fetch progress statistics for a character in a play
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const playId = searchParams.get("playId");
    const characterId = searchParams.get("characterId");
    const userId = "default-user"; // TODO: Get from auth

    if (!playId || !characterId) {
        return NextResponse.json(
            { error: "playId and characterId are required" },
            { status: 400 }
        );
    }

    try {
        // Get character progress
        const characterProgress = await prisma.userCharacterProgress.findUnique({
            where: {
                userId_characterId: {
                    userId,
                    characterId,
                },
            },
        });

        // Get line progress for this character
        const lineProgress = await prisma.userLineProgress.findMany({
            where: {
                userId,
                playbookId: playId,
                characterId,
            },
            select: {
                lineId: true,
                rehearsalCount: true,
                hintCount: true,
                progressPercent: true,
                lastPracticedAt: true,
            },
        });

        // Calculate statistics
        const totalRehearsals = lineProgress.reduce((sum, lp) => sum + lp.rehearsalCount, 0);
        const totalHints = lineProgress.reduce((sum, lp) => sum + lp.hintCount, 0);
        const linesRehearsed = lineProgress.filter(lp => lp.rehearsalCount > 0).length;
        const masteredLines = lineProgress.filter(lp => lp.progressPercent >= 80).length;

        return NextResponse.json({
            characterProgress: {
                totalLines: characterProgress?.totalLines ?? 0,
                masteredLines: characterProgress?.masteredLines ?? 0,
                lastPracticedAt: characterProgress?.lastPracticedAt,
            },
            sessionStats: {
                linesRehearsed,
                totalRehearsals,
                totalHints,
                masteredLines,
            },
            lineProgress: lineProgress.reduce((map, lp) => {
                map[lp.lineId] = {
                    rehearsalCount: lp.rehearsalCount,
                    hintCount: lp.hintCount,
                    progressPercent: lp.progressPercent,
                    lastPracticedAt: lp.lastPracticedAt,
                };
                return map;
            }, {} as Record<string, { rehearsalCount: number; hintCount: number; progressPercent: number; lastPracticedAt: Date }>),
        });
    } catch (error) {
        console.error("[Progress API] Error fetching progress:", error);
        return NextResponse.json(
            { error: "Failed to fetch progress" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/progress
 * Update progress for a line
 */
export async function POST(req: NextRequest) {
    const userId = "default-user"; // TODO: Get from auth

    try {
        const body = await req.json();
        const { playId, characterId, lineId, rehearsalDelta, hintDelta, progressPercent } = body;

        if (!playId || !characterId || !lineId) {
            return NextResponse.json(
                { error: "playId, characterId, and lineId are required" },
                { status: 400 }
            );
        }

        // Update line progress
        const lineProgress = await prisma.userLineProgress.upsert({
            where: {
                userId_lineId_characterId: {
                    userId,
                    lineId,
                    characterId,
                },
            },
            create: {
                userId,
                lineId,
                characterId,
                playbookId: playId,
                rehearsalCount: rehearsalDelta ?? 0,
                hintCount: hintDelta ?? 0,
                progressPercent: progressPercent ?? 0,
            },
            update: {
                rehearsalCount: { increment: rehearsalDelta ?? 0 },
                hintCount: { increment: hintDelta ?? 0 },
                progressPercent: progressPercent !== undefined ? progressPercent : undefined,
                lastPracticedAt: new Date(),
            },
        });

        // Update character progress
        const totalMasteredLines = await prisma.userLineProgress.count({
            where: {
                userId,
                characterId,
                progressPercent: { gte: 80 },
            },
        });

        await prisma.userCharacterProgress.upsert({
            where: {
                userId_characterId: {
                    userId,
                    characterId,
                },
            },
            create: {
                userId,
                characterId,
                playbookId: playId,
                totalLines: 0, // Will be updated separately
                masteredLines: totalMasteredLines,
            },
            update: {
                masteredLines: totalMasteredLines,
                lastPracticedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, lineProgress });
    } catch (error) {
        console.error("[Progress API] Error updating progress:", error);
        return NextResponse.json(
            { error: "Failed to update progress" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/progress
 * Batch update multiple lines' progress
 */
export async function PATCH(req: NextRequest) {
    const userId = "default-user"; // TODO: Get from auth

    try {
        const body = await req.json();
        const { playId, characterId, updates } = body;

        if (!playId || !characterId || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: "playId, characterId, and updates array are required" },
                { status: 400 }
            );
        }

        interface LineUpdate {
            lineId: string;
            rehearsalCount?: number;
            hintCount?: number;
            progressPercent?: number;
        }

        // Batch update all lines
        const results = await Promise.all(
            updates.map(async (update: LineUpdate) => {
                return prisma.userLineProgress.upsert({
                    where: {
                        userId_lineId_characterId: {
                            userId,
                            lineId: update.lineId,
                            characterId,
                        },
                    },
                    create: {
                        userId,
                        lineId: update.lineId,
                        characterId,
                        playbookId: playId,
                        rehearsalCount: update.rehearsalCount ?? 0,
                        hintCount: update.hintCount ?? 0,
                        progressPercent: update.progressPercent ?? 0,
                    },
                    update: {
                        rehearsalCount: update.rehearsalCount,
                        hintCount: update.hintCount,
                        progressPercent: update.progressPercent,
                        lastPracticedAt: new Date(),
                    },
                });
            })
        );

        // Update character progress
        const totalMasteredLines = await prisma.userLineProgress.count({
            where: {
                userId,
                characterId,
                progressPercent: { gte: 80 },
            },
        });

        await prisma.userCharacterProgress.upsert({
            where: {
                userId_characterId: {
                    userId,
                    characterId,
                },
            },
            create: {
                userId,
                characterId,
                playbookId: playId,
                totalLines: updates.length,
                masteredLines: totalMasteredLines,
            },
            update: {
                masteredLines: totalMasteredLines,
                lastPracticedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, updated: results.length });
    } catch (error) {
        console.error("[Progress API] Error batch updating progress:", error);
        return NextResponse.json(
            { error: "Failed to batch update progress" },
            { status: 500 }
        );
    }
}
