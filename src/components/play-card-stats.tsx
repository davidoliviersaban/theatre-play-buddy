"use client";

import { useSyncExternalStore } from "react";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Play } from "@/lib/mock-data";
import {
  getCurrentCharacterStats,
  getLastRehearsalDate,
} from "@/lib/play-storage";

interface PlayCardStatsProps {
  play: Play;
}

// Subscribe to a dummy external store that indicates client-side mounting
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PlayCardStats({ play }: PlayCardStatsProps) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isClient) return null;

  // Get stats for currently selected character only
  const { characterId, stats } = getCurrentCharacterStats(play.id);
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
  
  // Add lines rehearsed for this specific character
  if (stats && stats.linesRehearsed > 0) {
    parts.push(`${stats.linesRehearsed} lines`);
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

  if (!displayText) return null;

  return (
    <div className="mt-3">
      <Badge variant="secondary" className="gap-1.5 text-xs">
        <BarChart3 className="h-3 w-3" />
        {displayText}
      </Badge>
    </div>
  );
}
