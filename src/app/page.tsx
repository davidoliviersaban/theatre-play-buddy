import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayGrid } from "@/components/home/play-grid";
import { fetchAllPlays } from "@/lib/api/plays";
import { ParsingSessions } from "@/components/home/parsing-sessions";
import {
  getActiveSessions,
  getFailedSessions,
} from "@/lib/db/parsing-session-db";

export default async function Home() {
  const { plays } = await fetchAllPlays();
  const [activeSessions, failedSessions] = await Promise.all([
    getActiveSessions(),
    getFailedSessions(),
  ]);

  const sessions = [...activeSessions, ...failedSessions].map((session) => ({
    id: session.id,
    filename: session.filename,
    status: session.status,
    currentChunk: session.currentChunk,
    totalChunks: session.totalChunks,
    startedAt: session.startedAt.toISOString(),
    failureReason: session.failureReason || undefined,
    // Parsing state
    title: session.title || undefined,
    author: session.author || undefined,
    totalCharacters: session.totalCharacters,
    totalActs: session.totalActs,
    totalScenes: session.totalScenes,
    totalLines: session.totalLines,
    currentActIndex: session.currentActIndex ?? undefined,
    currentSceneIndex: session.currentSceneIndex ?? undefined,
    currentLineIndex: session.currentLineIndex ?? undefined,
    currentCharacters: session.currentCharacters,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Theatre Play Coach
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
            Your personal rehearsal companion.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/import">
            <Plus className="mr-2 h-4 w-4" /> Import Play
          </Link>
        </Button>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plays, authors, characters..."
            className="pl-10"
          />
        </div>
      </div>

      <ParsingSessions sessions={sessions} />

      <PlayGrid plays={plays} />
    </div>
  );
}
