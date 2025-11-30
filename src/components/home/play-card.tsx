"use client";

import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrophyIcon } from "@/components/ui/trophy-icon";
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

interface PlayCardProps {
  play: Playbook;
  status: "none" | "silver" | "gold";
}

const BACKGROUND_CLASSES = {
  gold: "bg-[rgba(255,215,0,0.2)]",
  silver: "bg-[rgba(192,192,192,0.2)]",
  none: "",
} as const;

const BORDER_CLASSES = {
  gold: "border-yellow-500/80",
  silver: "border-gray-500/80",
  none: "",
} as const;

const TROPHY_TITLES = {
  gold: "All characters mastered!",
  silver: "One character mastered",
} as const;

export function PlayCard({ play, status }: PlayCardProps) {
  return (
    <Card
      className={`relative flex flex-col transition-all hover:border-primary/50 hover:shadow-lg ${BORDER_CLASSES[status]} ${BACKGROUND_CLASSES[status]}`}
    >
      {status !== "none" && (
        <div className="absolute top-3 right-1 z-10">
          <TrophyIcon
            variant={status}
            title={TROPHY_TITLES[status]}
            className="h-10 w-10"
          />
        </div>
      )}
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
}
