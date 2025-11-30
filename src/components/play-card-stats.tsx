"use client";

import { useSyncExternalStore } from "react";
import { User } from "lucide-react";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { Badge } from "@/components/ui/badge";
import { calculateProgress } from "@/components/play/progress-bar";
import type { Playbook, Character, Line } from "@/lib/mock-data";
import {
  getCurrentCharacterStats,
  getLastRehearsalDate,
} from "@/lib/play-storage";

interface PlayCardStatsProps {
  play: Playbook;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useClientOnly() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getAllLines(play: Playbook): Line[] {
  return play.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.lines));
}

function getLearnedCharacters(
  play: Playbook,
  allLines: Line[],
  excludeCharacterId?: string
): Character[] {
  return play.characters
    .map((character) => ({
      character,
      progress: calculateProgress(allLines, play.id, character.id),
    }))
    .filter(
      ({ progress, character }) =>
        progress === 100 && character.id !== excludeCharacterId
    )
    .map(({ character }) => character);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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
