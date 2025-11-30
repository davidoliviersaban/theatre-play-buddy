"use client";
import Link from "next/link";
import { CheckCircle2, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_PLAYS } from "@/lib/mock-data";
import { useSyncExternalStore } from "react";
import { getCurrentCharacterStats } from "@/lib/play-storage";
import { DailyStatsTable } from "@/components/play/DailyStatsTable";

import React from "react";

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
          <div className="mb-4 inline-flex rounded-full bg-green-500/10 p-4">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lines Rehearsed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{linesRehearsed}</div>
              <p className="text-xs text-muted-foreground">
                Sessions: {totalSessions}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <p className="text-xs text-muted-foreground">
                Correct: {correctLines}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hints Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hintsUsed}</div>
              <p className="text-xs text-muted-foreground">
                Active Character: {currentStats.characterId ?? "None"}
              </p>
            </CardContent>
          </Card>
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
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Back to Library
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/practice/${resolvedParams.id}`}>
              <RotateCcw className="mr-2 h-4 w-4" /> Practice Again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
