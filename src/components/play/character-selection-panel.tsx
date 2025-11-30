"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Character } from "@/lib/mock-data";

interface CharacterSelectionPanelProps {
  characters: Character[];
  activeCharacterId?: string;
  onSelect: (characterId: string) => void;
}

export function CharacterSelectionPanel({
  characters,
  activeCharacterId,
  onSelect,
}: CharacterSelectionPanelProps) {
  return (
    <div className="mt-6 border-t pt-6">
      <h4 className="mb-4 text-base font-semibold">Character Selection</h4>
      <div className="space-y-3">
        {characters.map((char) => {
          const isActive = char.id === activeCharacterId;
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
                isActive && "border-primary/50 bg-primary/5"
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
                  {char.completionRate !== undefined && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {char.completionRate}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{char.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {char.description}
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
