import { Star, Eye, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Line, Playbook } from "@/lib/mock-data";
import { calculateProgress } from "@/components/play/progress-bar";
import { StructureProgressHeader } from "@/components/practice/structure-header";
import { removeWords } from "@/lib/word-removal";
import { Button } from "@/components/ui/button";

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
  // stage is derived from mastery, no explicit prop needed anymore
  stage?: number; // deprecated
  showHint?: boolean; // Show full text as hint
  onToggleHint?: () => void;
  onMarkAsKnown?: () => void;
  onNextLine?: () => void;
  getLineMastery?: (lineId: string) => {
    rehearsalCount: number;
    masteryPercentage: number;
    lastPracticed: string;
  } | null;
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
  // stage prop is no longer used; stage is derived from mastery
  // deprecated: stage is derived from mastery
  // remove unused stage
  showHint = false,
  onToggleHint,
  onMarkAsKnown,
  onNextLine,
  getLineMastery,
}: LineCardProps) {
  // Calculate top margin based on headers
  const headerHeight = isActStart ? 60 : isSceneStart ? 36 : 0;

  // Get live mastery data from storage (client-side only)
  // Use direct call since this component is already client-side
  const masteryData =
    getLineMastery && typeof window !== "undefined"
      ? getLineMastery(line.id)
      : null;

  const rehearsalCount =
    masteryData?.rehearsalCount || line.rehearsalCount || 0;
  const masteryPercentage = masteryData?.masteryPercentage || 0;

  // Merge stage and mastery: derive stage from mastery (0-5)
  const derivedStage = Math.min(5, Math.floor(masteryPercentage / 20));
  // If mastery > 90%, ensure stage is 5 (all words removed)
  const effectiveStage = masteryPercentage > 90 ? 5 : derivedStage;

  // Apply word removal for user's lines when not showing hint
  const displayText =
    isMe && !showHint && line.type !== "stage_direction"
      ? removeWords(line.text, effectiveStage)
      : line.text;

  return (
    <div
      ref={lineRef}
      className={cn(
        "relative rounded-lg p-6 transition-all duration-300",
        isCurrent ? "scale-105 ring-2 ring-primary" : "opacity-50 blur-[1px]",
        isMe ? "bg-secondary/10" : "bg-transparent"
      )}
      style={{
        marginTop: headerHeight > 0 ? `${headerHeight}px` : undefined,
      }}
    >
      {/* Scene/Act breaks */}
      {(isActStart || isSceneStart) && (
        <div
          className="absolute left-0 right-0"
          style={{ top: `-${headerHeight}px` }}
        >
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
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
            masteryPercentage >= 80
              ? "bg-green-500"
              : masteryPercentage >= 40
              ? "bg-yellow-500"
              : "bg-red-500"
          )}
          title={`Mastery: ${masteryPercentage}%`}
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
            {masteryPercentage}% • {rehearsalCount}x
          </span>
        )}
      </div>

      {line.type === "stage_direction" ? (
        <p
          className={cn(
            "text-sm italic leading-relaxed text-muted-foreground",
            isCurrent && "font-medium"
          )}
        >
          {displayText}
        </p>
      ) : (
        <>
          <p
            className={cn(
              "text-lg leading-relaxed",
              isCurrent && "font-medium"
            )}
          >
            {displayText}
          </p>
          {showHint && isMe && (
            <p className="mt-2 text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
              Hint: {line.text}
            </p>
          )}
        </>
      )}

      {/* Action buttons for current user line */}
      {isCurrent && isMe && line.type === "dialogue" && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleHint}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showHint ? "Hide" : "Show"} Hint
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (effectiveStage < 5) {
                  if (onMarkAsKnown) onMarkAsKnown();
                } else {
                  if (onNextLine) onNextLine();
                }
              }}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {effectiveStage < 5 ? "I Know It" : "Next Line"}
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            {effectiveStage === 0
              ? 'First read - Click "I Know It" to start removing words'
              : effectiveStage < 5
              ? `Stage ${effectiveStage}/5 • ${Math.round(
                  (effectiveStage / 5) * 100
                )}% words hidden`
              : 'Stage 5/5 • All words hidden - Click "Next Line" when mastered'}
          </div>
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
  lineStages: Record<string, number>;
  showHint: boolean;
  onToggleHint: () => void;
  onMarkAsKnown: () => void;
  onNextLine: () => void;
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
  lineStages,
  showHint,
  onToggleHint,
  onMarkAsKnown,
  onNextLine,
  getLineMastery,
}: LineByLineViewProps) {
  return (
    <div className="mx-auto max-w-[70ch] mt-12">
      {/* Script column */}
      <div className="space-y-6">
        {lines.map((line, index) => {
          const isCurrent = index === currentLineIndex;
          const isMe = line.characterId === characterId;
          const characterName =
            line.type === "stage_direction"
              ? "Stage direction"
              : play.characters.find((c) => c.id === line.characterId)?.name ||
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

          const stage = lineStages[line.id] || 0;

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
              stage={stage}
              showHint={isCurrent ? showHint : false}
              onToggleHint={onToggleHint}
              onMarkAsKnown={onMarkAsKnown}
              onNextLine={onNextLine}
              getLineMastery={getLineMastery}
            />
          );
        })}
      </div>
    </div>
  );
}
