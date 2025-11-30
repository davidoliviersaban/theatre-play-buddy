"use client";

import * as React from "react";
import { Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Character } from "@/lib/mock-data";

interface ActiveCharacterHeaderProps {
  character: Character;
  isSelectionOpen: boolean;
  onToggleSelection: () => void;
}

export function ActiveCharacterHeader({
  character,
  isSelectionOpen,
  onToggleSelection,
}: ActiveCharacterHeaderProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleSelection}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSelection();
        }
      }}
      className="flex flex-col cursor-pointer rounded-lg p-2 -m-6 transition-colors hover:bg-secondary/30 outline-none focus:ring-2 focus:ring-primary"
      aria-expanded={isSelectionOpen}
    >
      <div className="flex gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 flex-shrink-0">
          <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">
            Rehearsing as {character.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {character.description}
          </p>
          {character.completionRate !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${character.completionRate}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {character.completionRate}% Memorized
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground pt-3">
        <span>{isSelectionOpen ? "Hide" : "Change"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isSelectionOpen && "rotate-180"
          )}
        />
      </div>
    </div>
  );
}
