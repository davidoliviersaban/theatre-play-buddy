"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressBar } from "./progress-bar";
import { CompletionIcon } from "@/components/ui/completion-icon";
import type { Scene, Character } from "@/lib/mock-data";

interface SceneListItemProps {
  scene: Scene;
  playId: string;
  activeCharacter?: Character;
  sceneProgress: number;
  hasCharacterLines: boolean;
}

export function SceneListItem({
  scene,
  playId,
  activeCharacter,
  sceneProgress,
  hasCharacterLines,
}: SceneListItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-secondary/20 p-3">
      <div className="flex items-center gap-3">
        {activeCharacter && (
          <CompletionIcon
            progress={sceneProgress}
            hasContent={hasCharacterLines}
          />
        )}
        <div>
          <span className="font-medium">{scene.title}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {scene.lines.length} lines
          </span>
        </div>
        {activeCharacter && hasCharacterLines && (
          <ProgressBar progress={sceneProgress} size="sm" />
        )}
      </div>
      <IconButton
        icon={PlayCircle}
        size="sm"
        variant="ghost"
        disabled={!activeCharacter}
        asChild
      >
        <Link
          href={
            activeCharacter
              ? `/practice/${playId}?character=${activeCharacter.id}&start=${scene.id}`
              : "#"
          }
        >
          Start
        </Link>
      </IconButton>
    </div>
  );
}
