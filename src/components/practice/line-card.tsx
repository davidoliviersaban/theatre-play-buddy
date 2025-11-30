import { Star, Eye, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Line } from "@/lib/mock-data";
import { StructureProgressHeader } from "@/components/practice/structure-header";
import { removeWords } from "@/lib/word-removal";
import { Button } from "@/components/ui/button";
import { getMasteryColor, ICON_SIZES, OPACITY_LEVELS } from "@/lib/ui-constants";

export type LineWithMetadata = Line & {
  __actId: string;
  __actTitle: string;
  __sceneId: string;
  __sceneTitle: string;
};

export interface LineCardProps {
  line: LineWithMetadata;
  index: number;
  isCurrent: boolean;
  isMe: boolean;
  characterName: string;
  isSceneStart: boolean;
  isActStart: boolean;
  actProgress?: number;
  sceneProgress?: number;
  lineRef: (el: HTMLDivElement | null) => void;
  showHint?: boolean;
  onToggleHint?: () => void;
  onMarkAsKnown?: () => void;
  onNextLine?: () => void;
  onPrevLine?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
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
  showHint = false,
  onToggleHint,
  onMarkAsKnown,
  onNextLine,
  onPrevLine,
  canGoPrev = false,
  canGoNext = false,
  getLineMastery,
}: LineCardProps) {
  const headerHeight = isActStart ? 60 : isSceneStart ? 36 : 0;

  const masteryData =
    getLineMastery && typeof window !== "undefined"
      ? getLineMastery(line.id)
      : null;
  const rehearsalCount =
    masteryData?.rehearsalCount || line.rehearsalCount || 0;
  const masteryPercentage = masteryData?.masteryPercentage || 0;

  const derivedStage = Math.min(5, Math.floor(masteryPercentage / 20));
  const effectiveStage = masteryPercentage > 90 ? 5 : derivedStage;

  const displayText =
    isMe && !showHint && line.type !== "stage_direction"
      ? removeWords(line.text, effectiveStage)
      : line.text;

  return (
    <div className="relative">
      {/* Navigation buttons */}
      {isCurrent && canGoPrev && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="secondary"
            size="lg"
            onClick={onPrevLine}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChevronUp className={ICON_SIZES.md} />
          </Button>
        </div>
      )}
      {isCurrent && canGoNext && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="secondary"
            size="lg"
            onClick={onNextLine}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <ChevronDown className={ICON_SIZES.md} />
          </Button>
        </div>
      )}
      <div
        ref={lineRef}
        className={cn(
          "relative rounded-lg p-6 transition-all duration-300",
          isCurrent ? "scale-105 ring-2 ring-primary" : "opacity-50 blur-[1px]",
          isMe ? `bg-secondary/${OPACITY_LEVELS.subtle}` : "bg-transparent"
        )}
        style={{
          marginTop: headerHeight > 0 ? `${headerHeight}px` : undefined,
        }}
      >
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

        {isMe && (
          <div
            className={cn(
              "absolute -left-3 top-6 h-6 w-1 rounded-full",
              getMasteryColor(masteryPercentage)
            )}
            title={`Mastery: ${masteryPercentage}%`}
          />
        )}

        <div className="mb-2 flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider",
              isMe
                ? `bg-primary/${OPACITY_LEVELS.subtle} text-primary ring-1 ring-primary/30`
                : "bg-muted text-muted-foreground"
            )}
          >
            {isMe && (
              <Star
                className={cn(
                  "mr-1 fill-warning text-warning",
                  ICON_SIZES.xs
                )}
              />
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

        {isCurrent && isMe && line.type === "dialogue" && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleHint}
                className="flex-1"
              >
                <Eye className={cn("mr-2", ICON_SIZES.sm)} />
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
                <CheckCircle className={cn("mr-2", ICON_SIZES.sm)} />
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

        {isCurrent && !isMe && line.type === "dialogue" && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex-1" />
              <Button
                variant="default"
                size="sm"
                onClick={onNextLine}
                className="flex-1"
              >
                <CheckCircle className={cn("mr-2", ICON_SIZES.sm)} />
                Next Line
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
