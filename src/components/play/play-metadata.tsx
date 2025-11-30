"use client";

import { Users, Clock, BookOpen } from "lucide-react";
import type { Play } from "@/lib/mock-data";

interface PlayMetadataProps {
  play: Play;
}

export function PlayMetadata({ play }: PlayMetadataProps) {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">{play.title}</h1>
      <p className="mt-2 text-xl text-muted-foreground">{play.author}</p>

      <div className="mt-6 flex gap-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" /> {play.year}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4" /> {play.genre}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" /> {play.characters.length} Characters
        </div>
      </div>
    </div>
  );
}
