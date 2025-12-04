"use client";

import { useClientOnly } from "@/lib/utils/client-utils";

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
        <div
          className={`relative h-3 rounded-full bg-secondary ${widthClasses[size]}`}
        >
          <div
            className="absolute left-0 top-0 h-3 rounded-full bg-mastery-high"
            style={{ width: "0%" }}
          />
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

// Re-export for backwards compatibility
export { computeProgressPct } from "@/lib/utils/progress-utils";
