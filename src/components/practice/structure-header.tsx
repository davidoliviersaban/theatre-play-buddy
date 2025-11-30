import { ProgressBar } from "@/components/play/progress-bar";
import { CompletionIcon } from "@/components/ui/completion-icon";
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
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground", // base
        type === "act" && "text-[11px]",
        className
      )}
    >
      <CompletionIcon
        progress={progress ?? 0}
        hasContent={true}
        className="h-5 w-5"
      />
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
