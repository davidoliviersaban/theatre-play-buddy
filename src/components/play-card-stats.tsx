"use client";

import { useSyncExternalStore } from "react";
import { User } from "lucide-react";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { Badge } from "@/components/ui/badge";
import { ProgressBar, calculateProgress } from "@/components/play/progress-bar";
import type { Playbook } from "@/lib/mock-data";
import {
  getCurrentCharacterStats,
  getLastRehearsalDate,
} from "@/lib/play-storage";

interface PlayCardStatsProps {
  play: Playbook;
}

// Subscribe to a dummy external store that indicates client-side mounting
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PlayCardProgress({ play }: PlayCardStatsProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!isClient) return null;

  const { characterId } = getCurrentCharacterStats(play.id);

  // Calculate all lines for the play to pass to calculateProgress
  const allLines = play.acts.flatMap((act) =>
    act.scenes.flatMap((scene) => scene.lines)
  );
  const progress = characterId
    ? calculateProgress(allLines, play.id, characterId)
    : 0;

  if (progress === 0) return null;

  return (
    <div className="mt-2">
      <ProgressBar progress={progress} size="md" showLabel={true} />
    </div>
  );
}

export function PlayCardStats({ play }: PlayCardStatsProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!isClient) return null;

  // Get stats for currently selected character only
  const { characterId } = getCurrentCharacterStats(play.id);
  const lastDate = getLastRehearsalDate(play.id);

  if (!characterId && !lastDate) {
    return null;
  }

  const parts: string[] = [];

  // Add character name if available
  if (characterId) {
    const character = play.characters.find((c) => c.id === characterId);
    if (character) {
      parts.push(character.name);
    }
  }

  // Add last rehearsal time
  if (lastDate) {
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeText = "";
    if (diffMins < 1) timeText = "just now";
    else if (diffMins < 60) timeText = `${diffMins}m ago`;
    else if (diffHours < 24) timeText = `${diffHours}h ago`;
    else if (diffDays === 1) timeText = "yesterday";
    else if (diffDays < 7) timeText = `${diffDays}d ago`;
    else timeText = lastDate.toLocaleDateString();

    parts.push(timeText);
  }

  const displayText = parts.length > 0 ? parts.join(" • ") : null;
  // Compute progress for checkbox icon if character is selected
  const allLines = play.acts.flatMap((act) =>
    act.scenes.flatMap((scene) => scene.lines)
  );
  const progress = characterId
    ? calculateProgress(allLines, play.id, characterId)
    : 0;

  if (!displayText) return null;

  return (
    <div className="mt-3">
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
    </div>
  );
}
