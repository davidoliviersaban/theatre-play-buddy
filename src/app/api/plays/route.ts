import { NextRequest, NextResponse } from "next/server";
import { getAllPlays, getDbStats } from "@/lib/db/plays-db-prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/plays - Get all plays metadata
 * Query params:
 *   - stats=true: Include database statistics
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const includeStats = searchParams.get('stats') === 'true';

        const plays = await getAllPlays();

        if (includeStats) {
            const stats = await getDbStats();
            return NextResponse.json({ plays, stats });
        }

        return NextResponse.json({ plays });
    } catch (error) {
        console.error('[API /plays] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve plays' },
            { status: 500 }
        );
    }
}
