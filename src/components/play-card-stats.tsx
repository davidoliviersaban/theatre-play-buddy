import { User } from "lucide-react";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { Badge } from "@/components/ui/badge";
import { InlineStack } from "@/components/ui/inline-stack";
import type { Playbook } from "@/lib/types";
import { getAllLines, getLearnedCharacters } from "@/lib/utils/character-utils";
import { computeProgressPct } from "@/lib/utils/progress-utils";
import type { LineMastery } from "@/lib/play/line-mastery.utils";
import { prisma } from "@/lib/db/prisma";

interface PlayCardStatsProps {
  play: Playbook;
  getLineMastery: (lineId: string) => LineMastery | null;
}

async function getLastPracticedCharacter(playId: string) {
  const userId = "default-user"; // TODO: Get from auth

  try {
    const lastProgress = await prisma.userCharacterProgress.findFirst({
      where: {
        userId,
        playbookId: playId,
      },
      orderBy: {
        lastPracticedAt: "desc",
      },
    });

    return lastProgress?.characterId || null;
  } catch {
    return null;
  }
}

export async function PlayCardStats({
  play,
  getLineMastery,
}: PlayCardStatsProps) {
  const characterId = await getLastPracticedCharacter(play.id);
  const learnedCharacters = getLearnedCharacters(play, (charId) => {
    const lines = getAllLines(play, charId);
    return lines.filter((line) => {
      const mastery = getLineMastery(line.id);
      return mastery && mastery.masteryPercentage >= 80;
    }).length;
  });

  if (!characterId && learnedCharacters.length === 0) {
    return null;
  }

  const currentCharacter = characterId
    ? play.characters.find((c) => c.id === characterId)
    : null;
  const progress = currentCharacter
    ? computeProgressPct(getAllLines(play, currentCharacter.id), getLineMastery)
    : 0;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {currentCharacter && (
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <User className="h-3 w-3" />
          {currentCharacter.name}
          {progress > 0 && (
            <InlineStack gap={1} className="ml-2">
              <CompletionIcon
                progress={progress}
                hasContent={true}
                className="h-3.5 w-3.5"
              />
              {progress}%
            </InlineStack>
          )}
        </Badge>
      )}
      {learnedCharacters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {learnedCharacters.map((character) => (
            <Badge
              key={character.id}
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <CompletionIcon
                progress={100}
                hasContent={true}
                className="h-3.5 w-3.5"
              />
              {character.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
