import { NextRequest, NextResponse } from "next/server";
import { getPlayById, deletePlay, getPlayMetadataById } from "@/lib/db/plays-db-prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/plays/[id] - Get a specific play
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const includeMetadata = req.nextUrl.searchParams.get('meta') === 'true'
            || req.nextUrl.searchParams.get('include') === 'metadata';
        const play = await getPlayById(id);

        if (!play) {
            return NextResponse.json(
                { error: 'Play not found' },
                { status: 404 }
            );
        }

        if (includeMetadata) {
            const metadata = await getPlayMetadataById(id);
            return NextResponse.json({ play, metadata });
        }

        // Backward compatible: return raw play object
        return NextResponse.json(play);
    } catch (error) {
        console.error(`[API /plays/${(await params).id}] Error:`, error);
        return NextResponse.json(
            { error: 'Failed to retrieve play' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/plays/[id] - Delete a specific play
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleted = await deletePlay(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Play not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error(`[API /plays/${(await params).id}] Error:`, error);
        return NextResponse.json(
            { error: 'Failed to delete play' },
            { status: 500 }
        );
    }
}
