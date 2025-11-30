"use client";

interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  size = "md",
  showLabel = true,
}: ProgressBarProps) {
  const widthClasses = {
    sm: "w-12",
    md: "w-16",
    lg: "w-24",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 rounded-full bg-secondary ${widthClasses[size]}`}>
        <div
          className="h-2 rounded-full bg-green-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{progress}%</span>
      )}
    </div>
  );
}

export function calculateProgress(
  lines: Array<{ characterId: string; masteryLevel?: string }>,
  characterId?: string
): number {
  if (!characterId) return 0;

  const characterLines = lines.filter((l) => l.characterId === characterId);
  if (characterLines.length === 0) return 0;

  const masteredLines = characterLines.filter(
    (l) => l.masteryLevel === "high"
  ).length;

  return Math.floor((masteredLines / characterLines.length) * 100);
}
