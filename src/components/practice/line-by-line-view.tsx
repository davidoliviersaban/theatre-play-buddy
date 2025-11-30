import type { Playbook } from "@/lib/mock-data";
import { calculateProgress } from "@/components/play/progress-bar";
import {
  LineCard,
  type LineWithMetadata,
} from "@/components/practice/line-card";
import { getSpeakerIds } from "@/lib/parse/multi-character";

// Use LineWithMetadata from extracted component to keep types consistent

// LineCard moved to its own file for readability

// LineCard removed; see src/components/practice/line-card.tsx

interface LineByLineViewProps {
  lines: LineWithMetadata[];
  currentLineIndex: number;
  characterId: string;
  play: Playbook;
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  showHint: boolean;
  onToggleHint: () => void;
  onMarkAsKnown: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;

  getLineMastery: (lineId: string) => {
    rehearsalCount: number;
    masteryPercentage: number;
    lastPracticed: string;
  } | null;
}

export function LineByLineView({
  lines,
  currentLineIndex,
  characterId,
  play,
  lineRefs,
  showHint,
  onToggleHint,
  onMarkAsKnown,
  onNextLine,
  onPrevLine,
  getLineMastery,
}: LineByLineViewProps) {
  return (
    <div className="mx-auto max-w-[70ch] mt-12 relative">
      {/* Script column */}
      <div className="space-y-6">
        {lines.map((line, index) => {
          const isCurrent = index === currentLineIndex;
          const speakerIds = getSpeakerIds(line);
          const isMe = speakerIds.includes(characterId);
          const characterName =
            line.type === "stage_direction"
              ? "Stage Direction"
              : speakerIds.length > 1
              ? speakerIds
                  .map(
                    (id: string) =>
                      play.characters.find((c) => c.id === id)?.name ||
                      "Unknown"
                  )
                  .join(" & ")
              : play.characters.find((c) => c.id === speakerIds[0])?.name ||
                "Unknown speaker";

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
            actProgress = calculateProgress(actLines, play.id, characterId);
            sceneProgress = calculateProgress(sceneLines, play.id, characterId);
          }

          // stage is derived from mastery inside LineCard; local stage state is no longer used

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
              showHint={isCurrent ? showHint : false}
              onToggleHint={onToggleHint}
              onMarkAsKnown={onMarkAsKnown}
              onNextLine={onNextLine}
              onPrevLine={onPrevLine}
              getLineMastery={getLineMastery}
              canGoPrev={currentLineIndex > 0}
              canGoNext={currentLineIndex < lines.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
