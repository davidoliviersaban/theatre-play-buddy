import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineStack } from "@/components/ui/inline-stack";
import { TrophyIcon } from "@/components/ui/trophy-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlayMetadata } from "@/lib/types";
import { PlayCardStats } from "@/components/play-card-stats";
import { fetchPlayById } from "@/lib/api/plays";
import {
  areAllCharactersMastered,
  getMasteredCharacterCount,
} from "@/lib/utils/character-utils";
import { prisma } from "@/lib/db/prisma";
import { createLineMasteryGetterFromData } from "@/lib/play/line-mastery.utils";

interface PlayCardProps {
  play: PlayMetadata;
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

async function fetchProgressData(playId: string) {
  const userId = "default-user"; // TODO: Get from auth

  try {
    const lineProgress = await prisma.userLineProgress.findMany({
      where: {
        userId,
        playbookId: playId,
      },
      select: {
        lineId: true,
        rehearsalCount: true,
        progressPercent: true,
        lastPracticedAt: true,
      },
    });

    return lineProgress.reduce((map, lp) => {
      map[lp.lineId] = {
        rehearsalCount: lp.rehearsalCount,
        progressPercent: lp.progressPercent,
        lastPracticedAt: lp.lastPracticedAt,
      };
      return map;
    }, {} as Record<string, { rehearsalCount: number; progressPercent: number; lastPracticedAt: Date }>);
  } catch (error) {
    console.error("[PlayCard] Error fetching progress:", error);
    return {};
  }
}

export async function PlayCard({ play }: PlayCardProps) {
  // Fetch playbook and progress data server-side
  const [playbook, progressData] = await Promise.all([
    fetchPlayById(play.id),
    fetchProgressData(play.id),
  ]);

  const getLineMastery = createLineMasteryGetterFromData(progressData);

  // Calculate trophy status
  const allMastered = areAllCharactersMastered(playbook, getLineMastery);
  const status = allMastered
    ? "gold"
    : getMasteredCharacterCount(playbook, getLineMastery) > 0
    ? "silver"
    : "none";
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
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mt-1 flex flex-wrap gap-2 sm:mt-1">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {play.genre}
          </span>
          <InlineStack
            gap={1}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            title={`${play.characterCount} Characters`}
          >
            <Users className="h-3.5 w-3.5" /> {play.characterCount}
          </InlineStack>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <PlayCardStats play={playbook} getLineMastery={getLineMastery} />
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
