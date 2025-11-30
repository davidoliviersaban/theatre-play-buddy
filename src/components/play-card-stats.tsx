"use client";

import { User } from "lucide-react";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { Badge } from "@/components/ui/badge";
import { calculateProgress } from "@/components/play/progress-bar";
import type { Playbook } from "@/lib/mock-data";
import {
  getCurrentCharacterStats,
  getLastRehearsalDate,
} from "@/lib/play-storage";
import { getAllLines, getLearnedCharacters } from "@/lib/character-utils";
import { useClientOnly } from "@/lib/client-utils";
import { formatTimeAgo } from "@/lib/date-utils";

interface PlayCardStatsProps {
  play: Playbook;
}

export function PlayCardProgress({ play }: PlayCardStatsProps) {
  const isClient = useClientOnly();
  if (!isClient) return null;

  const { characterId } = getCurrentCharacterStats(play.id);
  if (!characterId) return null;

  const allLines = getAllLines(play);
  const progress = calculateProgress(allLines, play.id, characterId);

  if (progress === 0) return null;

  return (
    <div className="mt-2 text-xs text-muted-foreground">
      <CompletionIcon
        progress={progress}
        hasContent={true}
        className="h-3.5 w-3.5 inline mr-1"
      />
      {progress}%
    </div>
  );
}

export function PlayCardStats({ play }: PlayCardStatsProps) {
  const isClient = useClientOnly();
  if (!isClient) return null;

  const { characterId } = getCurrentCharacterStats(play.id);
  const lastDate = getLastRehearsalDate(play.id);
  const allLines = getAllLines(play);
  const learnedCharacters = getLearnedCharacters(
    play,
    allLines,
    characterId ?? undefined
  );

  if (!characterId && !lastDate && learnedCharacters.length === 0) {
    return null;
  }

  const currentCharacter = characterId
    ? play.characters.find((c) => c.id === characterId)
    : null;
  const progress = characterId
    ? calculateProgress(allLines, play.id, characterId)
    : 0;

  const parts: string[] = [];
  if (currentCharacter) parts.push(currentCharacter.name);
  if (lastDate) parts.push(formatTimeAgo(lastDate));
  const displayText = parts.join(" • ");

  return (
    <div className="mt-3 flex flex-col gap-2">
      {displayText && (
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <User className="h-3 w-3" />
          {displayText}
          {progress > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              <CompletionIcon
                progress={progress}
                hasContent={true}
                className="h-3.5 w-3.5"
              />
              {progress}%
            </span>
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
