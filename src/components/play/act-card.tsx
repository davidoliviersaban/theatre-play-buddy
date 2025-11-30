"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SceneListItem } from "./scene-list-item";
import { ProgressBar, calculateProgress } from "./progress-bar";
import { CompletionIcon } from "@/components/ui/completion-icon";
import type { Act, Character } from "@/lib/mock-data";

interface ActCardProps {
  act: Act;
  playId: string;
  activeCharacter?: Character;
}

export function ActCard({ act, playId, activeCharacter }: ActCardProps) {
  // Calculate act progress for selected character
  const actLines = act.scenes.flatMap((s) =>
    s.lines.filter((l) => l.characterId === activeCharacter?.id)
  );
  const actProgress = calculateProgress(
    act.scenes.flatMap((s) => s.lines),
    playId,
    activeCharacter?.id
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {activeCharacter && (
            <CompletionIcon
              progress={actProgress}
              hasContent={actLines.length > 0}
            />
          )}
          <CardTitle className="text-lg">{act.title}</CardTitle>
          {activeCharacter && actLines.length > 0 && (
            <ProgressBar progress={actProgress} size="md" />
          )}
        </div>
        <IconButton
          icon={PlayCircle}
          size="sm"
          disabled={!activeCharacter}
          asChild
        >
          <Link
            href={
              activeCharacter
                ? `/practice/${playId}?character=${activeCharacter.id}&start=${act.id}`
                : "#"
            }
          >
            Rehearse Act
          </Link>
        </IconButton>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {act.scenes.map((scene) => {
            const sceneLines = scene.lines.filter(
              (l) => l.characterId === activeCharacter?.id
            );
            const sceneProgress = calculateProgress(
              scene.lines,
              playId,
              activeCharacter?.id
            );

            return (
              <SceneListItem
                key={scene.id}
                scene={scene}
                playId={playId}
                activeCharacter={activeCharacter}
                sceneProgress={sceneProgress}
                hasCharacterLines={sceneLines.length > 0}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
