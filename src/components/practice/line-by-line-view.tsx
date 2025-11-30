import { Mic, PlayCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Line, Playbook } from "@/lib/mock-data";
import { calculateProgress } from "@/components/play/progress-bar";
import { StructureProgressHeader } from "@/components/practice/structure-header";

type LineWithMetadata = Line & {
  __actId: string;
  __actTitle: string;
  __sceneId: string;
  __sceneTitle: string;
};

interface LineCardProps {
  line: LineWithMetadata;
  index: number;
  isCurrent: boolean;
  isMe: boolean;
  characterName: string;
  isSceneStart: boolean;
  isActStart: boolean;
  actProgress?: number; // % mastery for user's lines in act
  sceneProgress?: number; // % mastery for user's lines in scene
  lineRef: (el: HTMLDivElement | null) => void;
}

export function LineCard({
  line,
  isCurrent,
  isMe,
  characterName,
  isSceneStart,
  isActStart,
  actProgress,
  sceneProgress,
  lineRef,
}: LineCardProps) {
  return (
    <div
      ref={lineRef}
      className={cn(
        "relative rounded-lg p-6 transition-all duration-300",
        isCurrent ? "scale-105 ring-2 ring-primary" : "opacity-50 blur-[1px]",
        isMe ? "bg-secondary/10" : "bg-transparent"
      )}
    >
      {/* Scene/Act breaks */}
      {(isActStart || isSceneStart) && (
        <div className="absolute -top-10 left-0 right-0 mb-4">
          <div className="mb-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
            {isActStart && (
              <StructureProgressHeader
                title={line.__actTitle}
                progress={actProgress}
                type="act"
              />
            )}
            <StructureProgressHeader
              title={line.__sceneTitle}
              progress={sceneProgress}
              type="scene"
            />
          </div>
        </div>
      )}

      {/* Mastery Indicator */}
      {isMe && (
        <div
          className={cn(
            "absolute -left-3 top-6 h-6 w-1 rounded-full",
            line.masteryLevel === "high"
              ? "bg-green-500"
              : line.masteryLevel === "medium"
              ? "bg-yellow-500"
              : "bg-red-500"
          )}
          title={`Mastery: ${line.masteryLevel}`}
        />
      )}

      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider",
            isMe
              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isMe && (
            <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
          )}
          {characterName}
        </span>
        {isMe && (
          <span className="text-xs text-muted-foreground">
            Rehearsed: {line.rehearsalCount || 0}x
          </span>
        )}
      </div>

      <p className={cn("text-lg leading-relaxed", isCurrent && "font-medium")}>
        {line.text}
      </p>

      {/* Status Indicator for Current Line */}
      {isCurrent && (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary animate-pulse">
          {isMe ? (
            <>
              <Mic className="h-4 w-4" /> Your turn: Speak now
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" /> Reading cue
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface LineByLineViewProps {
  lines: LineWithMetadata[];
  currentLineIndex: number;
  characterId: string;
  play: Playbook;
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export function LineByLineView({
  lines,
  currentLineIndex,
  characterId,
  play,
  lineRefs,
}: LineByLineViewProps) {
  return (
    <div className="mx-auto max-w-[70ch] mt-12">
      {/* Script column */}
      <div className="space-y-6">
        {lines.map((line, index) => {
          const isCurrent = index === currentLineIndex;
          const isMe = line.characterId === characterId;
          const characterName =
            play.characters.find((c) => c.id === line.characterId)?.name ||
            "Unknown";

          const isSceneStart =
            index === 0 || lines[index - 1].__sceneId !== line.__sceneId;
          const isActStart =
            index === 0 || lines[index - 1].__actId !== line.__actId;

          // Calculate progress metrics (percentage of user's lines mastered in act/scene)
          let actProgress: number | undefined;
          let sceneProgress: number | undefined;
          if (isSceneStart || isActStart) {
            const actLines = lines.filter((l) => l.__actId === line.__actId);
            const sceneLines = lines.filter(
              (l) => l.__sceneId === line.__sceneId
            );
            actProgress = calculateProgress(actLines, characterId);
            sceneProgress = calculateProgress(sceneLines, characterId);
          }

          return (
            <LineCard
              key={line.id}
              line={line}
              index={index}
              isCurrent={isCurrent}
              isMe={isMe}
              characterName={characterName}
              isSceneStart={isSceneStart}
              isActStart={isActStart}
              actProgress={actProgress}
              sceneProgress={sceneProgress}
              lineRef={(el) => {
                lineRefs.current[index] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
