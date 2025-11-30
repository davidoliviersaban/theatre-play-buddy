"use client";

import { useSyncExternalStore } from "react";
import type { Playbook } from "@/lib/mock-data";
import { calculateProgress } from "@/components/play/progress-bar";
import { PlayCard } from "@/components/home/play-card";

interface PlayGridProps {
  plays: Playbook[];
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function calculatePlayStatus(
  plays: Playbook,
  playId: string
): "none" | "silver" | "gold" {
  const allLines = plays.acts.flatMap((a) => a.scenes.flatMap((s) => s.lines));
  const perCharacter = plays.characters.map((c) =>
    calculateProgress(allLines, playId, c.id)
  );
  const allComplete =
    perCharacter.length > 0 && perCharacter.every((p) => p === 100);
  const anyComplete = perCharacter.some((p) => p === 100);
  return allComplete ? "gold" : anyComplete ? "silver" : "none";
}

export function PlayGrid({ plays }: PlayGridProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
      suppressHydrationWarning
    >
      {plays.map((play) => {
        const status = isClient ? calculatePlayStatus(play, play.id) : "none";
        return <PlayCard key={play.id} play={play} status={status} />;
      })}
    </div>
  );
}
