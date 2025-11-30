"use client";
import * as React from "react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CheckCircle2, RotateCcw, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPACITY_LEVELS } from "@/lib/ui-constants";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { MOCK_PLAYS } from "@/lib/mock-data";
import { getCurrentCharacterStats } from "@/lib/play-storage";
import { DailyStatsTable } from "@/components/play/DailyStatsTable";

export default function SessionSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const play =
    MOCK_PLAYS.find((p) => p.id === resolvedParams.id) || MOCK_PLAYS[0];
  const currentStats = isClient
    ? getCurrentCharacterStats(play.id)
    : { characterId: null, stats: null };
  // Removed unused aggregated stats

  const linesRehearsed = currentStats.stats?.linesRehearsed ?? 0;
  const correctLines = currentStats.stats?.correctLines ?? 0;
  const hintsUsed = currentStats.stats?.hintsUsed ?? 0;
  const totalSessions = currentStats.stats?.totalSessions ?? 0;

  const accuracy =
    linesRehearsed > 0 ? Math.round((correctLines / linesRehearsed) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className={cn("mb-4 inline-flex rounded-full p-4", `bg-success/${OPACITY_LEVELS.subtle}`)}>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Session Complete!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Great work on “{play.title}”. Here’s how you did.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard
            title="Lines Rehearsed"
            value={linesRehearsed}
            subtitle={`Sessions: ${totalSessions}`}
          />
          <StatCard
            title="Accuracy"
            value={`${accuracy}%`}
            subtitle={`Correct: ${correctLines}`}
          />
          <StatCard
            title="Hints Used"
            value={hintsUsed}
            subtitle={`Active Character: ${currentStats.characterId ?? "None"}`}
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Daily Statistics</h2>
          <Card>
            <CardContent className="p-0">
              <DailyStatsTable playId={play.id} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <IconButton variant="outline" icon={Home} asChild>
            <Link href="/">Back to Library</Link>
          </IconButton>
          <IconButton icon={RotateCcw} asChild>
            <Link href={`/practice/${resolvedParams.id}`}>Practice Again</Link>
          </IconButton>
        </div>
      </div>
    </div>
  );
}
