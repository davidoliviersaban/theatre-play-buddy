import { Check } from "lucide-react";
import { ProgressBar } from "@/components/play/progress-bar";
import { cn } from "@/lib/utils";
import React from "react";

interface StructureProgressHeaderProps {
  title: string;
  progress?: number; // 0-100
  type: "act" | "scene";
  size?: "lg" | "md"; // progress bar size
  uppercase?: boolean; // act styling
  showSeparator?: boolean;
  className?: string;
}

export function StructureProgressHeader({
  title,
  progress,
  type,
  size = type === "act" ? "lg" : "md",
  uppercase = type === "act",
  showSeparator = true,
  className,
}: StructureProgressHeaderProps) {
  const mastered = typeof progress === "number" && progress === 100;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground", // base
        type === "act" && "text-[11px]",
        className
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full shadow ring-2",
          mastered
            ? "bg-green-500 text-white ring-green-600"
            : "bg-muted text-muted-foreground ring-border"
        )}
        title={
          mastered
            ? `${type === "act" ? "Act" : "Scene"} mastered`
            : `${type === "act" ? "Act" : "Scene"} in progress`
        }
        aria-label={mastered ? `${type} mastered` : `${type} in progress`}
      >
        {mastered && <Check className="h-3 w-3" />}
      </span>
      <span
        className={cn(
          "inline-flex items-center rounded bg-muted px-2 py-1 font-medium",
          uppercase && "font-semibold uppercase tracking-wide"
        )}
      >
        {title}
      </span>
      {typeof progress === "number" && (
        <ProgressBar progress={progress} size={size} showLabel={false} />
      )}
      {showSeparator && <span className="h-px flex-1 bg-border" />}
    </div>
  );
}
