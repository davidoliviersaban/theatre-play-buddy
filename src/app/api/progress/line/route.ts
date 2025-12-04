import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/progress/line?playId=X&characterId=Y&lineId=Z
 * Fetch mastery data for a specific line
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const playId = searchParams.get("playId");
    const characterId = searchParams.get("characterId");
    const lineId = searchParams.get("lineId");
    const userId = "default-user"; // TODO: Get from auth

    if (!playId || !characterId || !lineId) {
        return NextResponse.json(
            { error: "playId, characterId, and lineId are required" },
            { status: 400 }
        );
    }

    try {
        const lineProgress = await prisma.userLineProgress.findUnique({
            where: {
                userId_lineId_characterId: {
                    userId,
                    lineId,
                    characterId,
                },
            },
            select: {
                rehearsalCount: true,
                progressPercent: true,
                lastPracticedAt: true,
            },
        });

        if (!lineProgress) {
            return NextResponse.json({ mastery: null });
        }

        return NextResponse.json({
            mastery: {
                rehearsalCount: lineProgress.rehearsalCount,
                masteryPercentage: lineProgress.progressPercent,
                lastPracticed: lineProgress.lastPracticedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("[Line Progress API] Error fetching line mastery:", error);
        return NextResponse.json(
            { error: "Failed to fetch line mastery" },
            { status: 500 }
        );
    }
}
