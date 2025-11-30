"use client";

import * as React from "react";
import { ActiveCharacterHeader } from "./active-character-header";
import { CharacterSelectionPanel } from "./character-selection-panel";
import { cn } from "@/lib/utils";
import { OPACITY_LEVELS } from "@/lib/ui-constants";
import type { Character, Playbook } from "@/lib/mock-data";

interface CharacterSelectorProps {
  play: Playbook;
  activeCharacter?: Character;
  onCharacterSelect: (characterId: string) => void;
}

export function CharacterSelector({
  play,
  activeCharacter,
  onCharacterSelect,
}: CharacterSelectorProps) {
  const [isSelectionOpen, setIsSelectionOpen] = React.useState(
    !activeCharacter
  );

  const handleSelect = React.useCallback(
    (characterId: string) => {
      onCharacterSelect(characterId);
      setIsSelectionOpen(false);
    },
    [onCharacterSelect]
  );

  return (
    <div className={cn("mt-8 rounded-lg border p-6", `bg-secondary/${OPACITY_LEVELS.subtle}`)}>
      {activeCharacter ? (
        <ActiveCharacterHeader
          play={play}
          character={activeCharacter}
          isSelectionOpen={isSelectionOpen}
          onToggleSelection={() => setIsSelectionOpen(!isSelectionOpen)}
        />
      ) : (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Choose a character</h3>
          <p className="text-sm text-muted-foreground">
            Select a character to begin rehearsing.
          </p>
        </div>
      )}

      {isSelectionOpen && (
        <CharacterSelectionPanel
          play={play}
          characters={play.characters}
          activeCharacterId={activeCharacter?.id}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
