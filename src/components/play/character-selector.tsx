"use client";

import * as React from "react";
import { ActiveCharacterHeader } from "./active-character-header";
import { CharacterSelectionPanel } from "./character-selection-panel";
import type { Character, Play } from "@/lib/mock-data";

interface CharacterSelectorProps {
  play: Play;
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

  if (!activeCharacter) return null;

  return (
    <div className="mt-8 rounded-lg border bg-secondary/10 p-6">
      <ActiveCharacterHeader
        character={activeCharacter}
        isSelectionOpen={isSelectionOpen}
        onToggleSelection={() => setIsSelectionOpen(!isSelectionOpen)}
      />

      {isSelectionOpen && (
        <CharacterSelectionPanel
          characters={play.characters}
          activeCharacterId={activeCharacter.id}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
