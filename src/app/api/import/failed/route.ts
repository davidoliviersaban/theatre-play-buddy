import { NextResponse } from "next/server";

/**
 * GET /api/import/failed
 * Returns list of failed parsing sessions
 */
export async function GET() {
  // TODO: Implement
  return NextResponse.json({ sessions: [] });
}
