"use client";

import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Playbook } from "@/lib/mock-data";
import { PlayCardStats } from "@/components/play-card-stats";
import { calculateProgress } from "@/components/play/progress-bar";

interface PlayGridProps {
  plays: Playbook[];
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PlayGrid({ plays }: PlayGridProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
      suppressHydrationWarning
    >
      {plays.map((play) => {
        let status: "none" | "green" | "gold" = "none";
        if (isClient) {
          const allLines = play.acts.flatMap((a) =>
            a.scenes.flatMap((s) => s.lines)
          );
          const perCharacter = play.characters.map((c) =>
            calculateProgress(allLines, play.id, c.id)
          );
          const allComplete =
            perCharacter.length > 0 && perCharacter.every((p) => p === 100);
          const anyComplete = perCharacter.some((p) => p === 100);
          status = allComplete ? "gold" : anyComplete ? "green" : "none";
        }

        const statusClasses =
          status === "gold"
            ? "border-yellow-500/80"
            : status === "green"
            ? "border-green-500/80"
            : "";

        return (
          <Card
            key={play.id}
            className={`flex flex-col transition-all hover:border-primary/50 hover:shadow-lg ${statusClasses}`}
          >
            <CardHeader>
              <CardTitle className="line-clamp-1">{play.title}</CardTitle>
              <CardDescription>
                {play.author} • {play.year}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <PlayCardStats play={play} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="line-clamp-4 text-sm text-muted-foreground sm:line-clamp-3">
                {play.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {play.genre}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  title={`${play.characters.length} Characters`}
                >
                  <Users className="h-3.5 w-3.5" /> {play.characters.length}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="secondary">
                <Link href={`/play/${play.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" /> Open Play
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
