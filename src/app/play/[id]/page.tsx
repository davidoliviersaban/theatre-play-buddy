"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_PLAYS } from "@/lib/mock-data";
import { useCharacterSelection } from "@/hooks/use-character-selection";
import { PlayMetadata } from "@/components/play/play-metadata";
import { CharacterSelector } from "@/components/play/character-selector";
import { ActCard } from "@/components/play/act-card";

export default function PlayDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In Next.js 15+, params is a Promise and must be unwrapped
  const { id } = React.use(params);
  const play = MOCK_PLAYS.find((p) => p.id === id) || MOCK_PLAYS[0];

  const { activeCharacter, setSelectedCharacterId } =
    useCharacterSelection(play);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PlayMetadata play={play} resumeOnly />
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div>
          <PlayMetadata play={play} />

          <CharacterSelector
            play={play}
            activeCharacter={activeCharacter}
            onCharacterSelect={setSelectedCharacterId}
          />

          <div className="mt-6 sm:mt-8">
            <h2 className="mb-3 text-xl font-semibold sm:mb-4 sm:text-2xl">
              Synopsis
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {play.description}
            </p>
          </div>

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
                  No acts/scenes data available for this mock.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
