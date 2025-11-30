"use client";

import Link from "next/link";
import { Users, Clock, BookOpen, Play as PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playbook } from "@/lib/mock-data";
import { getCurrentCharacterId, getLastLineIndex } from "@/lib/play-storage";
import { useSyncExternalStore } from "react";

interface PlayMetadataProps {
  play: Playbook;
}

// Subscribe to a dummy external store that indicates client-side mounting
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PlayMetadata({ play }: PlayMetadataProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Get resume info from storage
  const characterId = isClient ? getCurrentCharacterId(play.id) : null;
  const lastLineIndex =
    isClient && characterId ? getLastLineIndex(play.id, characterId) : null;
  const canResume = Boolean(characterId && lastLineIndex !== null);

  return (
    <div>
      <div className="flex items-start justify-between">
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
              <Users className="mr-2 h-4 w-4" /> {play.characters.length}{" "}
              Characters
            </div>
          </div>
        </div>
        {canResume && (
          <Button asChild size="lg">
            <Link href={`/practice/${play.id}?character=${characterId}`}>
              <PlayIcon className="mr-2 h-4 w-4" /> Resume Practice
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
