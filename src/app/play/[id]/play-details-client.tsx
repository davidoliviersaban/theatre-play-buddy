"use client";

import type { Playbook } from "@/lib/types";
import { useCharacterSelection } from "@/hooks/use-character-selection";
import { PlayMetadata } from "@/components/play/play-metadata";
import { CharacterSelector } from "@/components/play/character-selector";
import { ActCard } from "@/components/play/act-card";

interface PlayDetailsClientProps {
  play: Playbook | null;
}

export function PlayDetailsClient({ play }: PlayDetailsClientProps) {
  const { activeCharacter, setSelectedCharacterId } =
    useCharacterSelection(play);

  if (!play) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading play data...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <PlayMetadata play={play} />

        <CharacterSelector
          play={play}
          activeCharacter={activeCharacter}
          onCharacterSelect={setSelectedCharacterId}
        />

        {play.description && (
          <div className="mt-6 sm:mt-8">
            <h2 className="mb-3 text-xl font-semibold sm:mb-4 sm:text-2xl">
              Synopsis
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {play.description}
            </p>
          </div>
        )}

        <div className="mt-8 sm:mt-12">
          <h2 className="mb-3 text-xl font-semibold sm:mb-4 sm:text-2xl">
            Structure
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {play.acts.length > 0 ? (
              play.acts.map((act) => (
                <ActCard
                  key={act.id}
                  act={act}
                  playId={play.id}
                  activeCharacter={activeCharacter}
                />
              ))
            ) : (
              <p className="text-muted-foreground">
                No acts/scenes data available for this play.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
