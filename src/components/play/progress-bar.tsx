"use client";

import { useClientOnly } from "@/lib/client-utils";

interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean; // shows a separate inline label next to the bar
  labelInside?: boolean; // shows the percentage centered inside the bar
}

export function ProgressBar({
  progress,
  size = "md",
  showLabel = true,
  labelInside = true,
}: ProgressBarProps) {
  const isClient = useClientOnly();
  
  const widthClasses = {
    sm: "w-12",
    md: "w-16",
    lg: "w-24",
  };

  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  // Render placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex items-center gap-2">
        <div className={`relative h-3 rounded-full bg-secondary ${widthClasses[size]}`}>
          <div className="absolute left-0 top-0 h-3 rounded-full bg-mastery-high" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative h-3 rounded-full bg-secondary ${widthClasses[size]}`}
      >
        <div
          className="absolute left-0 top-0 h-3 rounded-full bg-mastery-high"
          style={{ width: `${normalizedProgress}%` }}
        />
        {labelInside && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground/70">
            {normalizedProgress}%
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
}

import type { Line } from "@/lib/mock-data";
import { getLineMastery } from "@/lib/play-storage";

// Progress is merged with mastery: compute average mastery percentage across character's lines
export function calculateProgress(
  lines: Array<Line>,
  playId: string,
  characterId?: string
): number {
  if (!characterId) return 0;
  if (typeof window === "undefined") return 0;

  // Only consider dialogue lines belonging to the character
  const characterLines = lines.filter(
    (l) => l.characterId === characterId && l.type === "dialogue"
  );
  if (characterLines.length === 0) return 0;

  let total = 0;
  for (const line of characterLines) {
    const mastery = getLineMastery(playId, characterId, line.id);
    total += mastery?.masteryPercentage ?? 0;
  }
  const avg = total / characterLines.length;
  return Math.round(avg);
}
