import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayGrid } from "@/components/home/play-grid";
import { fetchAllPlays } from "@/lib/api/plays";
import { ParsingSessions } from "@/components/home/parsing-sessions";
import { getActiveJobs, getFailedJobs } from "@/lib/db/parse-job-db";
import { ParsingSession } from "@prisma/client";

export default async function Home() {
  const { plays } = await fetchAllPlays();
  const [activeSessions, failedSessions] = await Promise.all([
    getActiveJobs(),
    getFailedJobs(),
  ]);

  const sessions: ParsingSession[] = [...activeSessions, ...failedSessions]
    .filter((job) => job.status !== "cancelled" && job.status !== "queued")
    .map((job) => {
      // Extract metadata from config if it exists
      const config = job.config as any;
      return {
        id: job.id,
        filename: job.filename,
        status: job.status,
        currentChunk: job.completedChunks,
        totalChunks: job.totalChunks ?? 0,
        startedAt: (job.startedAt?.toISOString() ?? job.createdAt.toISOString()) as string,
        failureReason: job.failureReason || null,
        // Parsing state from config or currentState
        title: config?.title || undefined,
        author: config?.author || undefined,
        totalCharacters: config?.totalCharacters || 0,
        totalActs: config?.totalActs || 0,
        totalScenes: config?.totalScenes || 0,
        totalLines: config?.totalLines || 0,
        currentActIndex: config?.currentActIndex ?? undefined,
        currentSceneIndex: config?.currentSceneIndex ?? undefined,
        currentLineIndex: config?.currentLineIndex ?? undefined,
        currentCharacters: config?.currentCharacters || [],
      } as ParsingSession;
    });

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
