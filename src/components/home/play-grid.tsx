"use client";

import type { PlayMetadata } from "@/lib/types";
import { PlayCard } from "@/components/home/play-card";

interface PlayGridProps {
  plays: PlayMetadata[];
}

export function PlayGrid({ plays }: PlayGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plays.map((play) => (
        <PlayCard key={play.id} play={play} />
      ))}
    </div>
  );
}
