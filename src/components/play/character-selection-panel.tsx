"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { calculateProgress } from "@/components/play/progress-bar";
import { cn } from "@/lib/utils";
import { InlineStack } from "@/components/ui/inline-stack";
import { OPACITY_LEVELS } from "@/lib/ui-constants";
import type { Character, Playbook } from "@/lib/mock-data";
import {
  getAllLines,
  getLearnedLinesCount,
  getTotalLinesCount,
} from "@/lib/character-utils";

interface CharacterSelectionPanelProps {
  play: Playbook;
  characters: Character[];
  activeCharacterId?: string;
  onSelect: (characterId: string) => void;
}

export function CharacterSelectionPanel({
  play,
  characters,
  activeCharacterId,
  onSelect,
}: CharacterSelectionPanelProps) {
  return (
    <div className="mt-6 pt-6">
      <h4 className="mb-4 text-base font-semibold">Character Selection</h4>
      <div className="space-y-3">
        {characters.map((char) => {
          const isActive = char.id === activeCharacterId;
          const allLines = getAllLines(play);
          const progress = calculateProgress(allLines, play.id, char.id);
          const totalLines = getTotalLinesCount(allLines, char.id);
          const learnedLines = getLearnedLinesCount(play.id, char.id, allLines);

          return (
            <div
              key={char.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(char.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(char.id);
                }
              }}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border p-3 outline-none transition-colors hover:bg-secondary/50 focus:ring-2 focus:ring-primary",
                isActive && `border-primary/50 bg-primary/${OPACITY_LEVELS.subtle}`
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  {isActive ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-yellow-500">
                      <Star className="h-4 w-4 fill-yellow-500" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                      <Star className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {char.name}
                    <InlineStack gap={1} className="text-[10px] font-medium text-muted-foreground">
                      <CompletionIcon
                        progress={progress}
                        hasContent={true}
                        className="h-3.5 w-3.5"
                      />
                      {progress}%
                    </InlineStack>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {char.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {learnedLines}/{totalLines} lines learned
                  </p>
                </div>
              </div>
              <div>
                <Badge variant={isActive ? "default" : "outline"}>
                  {isActive ? "Active" : "Select"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
