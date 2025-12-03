import { cn } from "@/lib/utils";
import type { Line, Playbook } from "@/lib/types";
import { calculateProgress } from "@/components/play/progress-bar";
import { useRef, useEffect } from "react";
import { StructureProgressHeader } from "@/components/practice/structure-header";
import { getLineMastery } from "@/lib/play-storage";
import { CompletionIcon } from "@/components/ui/completion-icon";
import { OPACITY_LEVELS } from "@/lib/ui-constants";
import { getSpeakerIds } from "@/lib/play/multi-character";

// Extended line type used in practice session (flattened with metadata)
type LineWithMetadata = Line & {
  __actId: string;
  __actTitle: string;
  __sceneId: string;
  __sceneTitle: string;
};

interface GroupedParagraph {
  characterId: string;
  text: string;
  lineIndices: number[]; // underlying line indexes from global flattened list
}

function groupLinesByCharacterWithIndices(
  lines: LineWithMetadata[],
  globalLines: LineWithMetadata[]
): GroupedParagraph[] {
  const groups: GroupedParagraph[] = [];
  for (const line of lines) {
    // Stage directions are kept as independent groups for distinct styling
    if (line.type === "stage_direction") {
      groups.push({
        characterId: "__stage__",
        text: line.text,
        lineIndices: [globalLines.indexOf(line)],
      });
      continue;
    }
    const globalIndex = globalLines.indexOf(line);
    const last = groups[groups.length - 1];
    const speakerIds = getSpeakerIds(line);
    const currentCharId = speakerIds.join(",") || "__unknown__";

    if (last && last.characterId === currentCharId) {
      last.text = `${last.text} ${line.text}`.trim();
      last.lineIndices.push(globalIndex);
    } else {
      groups.push({
        characterId: currentCharId,
        text: line.text,
        lineIndices: [globalIndex],
      });
    }
  }
  return groups;
}

interface BookViewProps {
  play: Playbook;
  characterId: string;
  lines: LineWithMetadata[]; // flattened lines with metadata
  currentLineIndex: number;
  viewMode?: "line" | "book"; // used to trigger scroll when switching into book view
}

export function BookView({
  play,
  characterId,
  lines,
  currentLineIndex,
  viewMode,
}: BookViewProps) {
  const currentGroupRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    // Scroll when current line changes or when view switches to book
    if (viewMode === "book" && currentGroupRef.current) {
      // slight delay ensures layout settled after mode switch
      const id = setTimeout(() => {
        currentGroupRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 10);
      return () => clearTimeout(id);
    }
  }, [currentLineIndex, viewMode]);

  return (
    <div className="mx-auto max-w-[70ch] space-y-8">
      {play.acts.map((act) => (
        <div key={act.id}>
          <StructureProgressHeader
            title={act.title}
            progress={calculateProgress(
              act.scenes.flatMap((s) => s.lines),
              play.id,
              characterId
            )}
            type="act"
            className="mb-2"
          />
          <div className="space-y-6">
            {act.scenes.map((scene) => {
              // Collect lines for this scene from flattened list (preserves ordering & mastery)
              const sceneLines = lines.filter(
                (l) => l.__sceneId === scene.id && l.__actId === act.id
              );
              const grouped = groupLinesByCharacterWithIndices(
                sceneLines,
                lines
              );
              return (
                <div key={scene.id}>
                  <StructureProgressHeader
                    title={scene.title}
                    progress={calculateProgress(
                      scene.lines,
                      play.id,
                      characterId
                    )}
                    type="scene"
                    className="mb-3"
                  />
                  {grouped.map((group, gi) => {
                    const isStage = group.characterId === "__stage__";
                    const speakerIds = group.characterId
                      .split(",")
                      .filter(Boolean);
                    const isMeGroup =
                      !isStage && speakerIds.includes(characterId);
                    const charName = isStage
                      ? "Narration"
                      : speakerIds.length > 1
                      ? speakerIds
                          .map(
                            (id: string) =>
                              play.characters.find((c) => c.id === id)?.name ||
                              "Unknown"
                          )
                          .join(" & ")
                      : play.characters.find((c) => c.id === speakerIds[0])
                          ?.name || "Unknown";
                    const isCurrentGroup =
                      group.lineIndices.includes(currentLineIndex);
                    // Aggregate mastery across this group's lines (dialogue only)
                    let avgMasteryPct = 0;
                    if (!isStage) {
                      const primaryCharId =
                        speakerIds.length > 0 ? speakerIds[0] : "";
                      const lineMasteries = group.lineIndices
                        .map((li) => lines[li])
                        .filter((ln) => ln.type === "dialogue")
                        .map(
                          (ln) =>
                            getLineMastery(play.id, primaryCharId, ln.id)
                              ?.masteryPercentage ?? 0
                        );
                      if (lineMasteries.length > 0) {
                        avgMasteryPct = Math.round(
                          lineMasteries.reduce((a, b) => a + b, 0) /
                            lineMasteries.length
                        );
                      }
                    }
                    // Mastery checkbox: checked when mastered (>= 80%)
                    const isMastered = !isStage && avgMasteryPct >= 80;
                    // Calculate indent level for this group (use first line's formatting)
                    const firstLineIdx = group.lineIndices[0];
                    const firstLine =
                      firstLineIdx !== undefined
                        ? lines[firstLineIdx]
                        : undefined;
                    const indentLevel =
                      (firstLine as any)?.formatting?.indentLevel || 0;
                    const hasLineBreak =
                      (firstLine as any)?.formatting?.preserveLineBreaks ||
                      false;

                    return (
                      <p
                        key={`${scene.id}-g-${gi}`}
                        className={cn(
                          "relative leading-relaxed transition-colors",
                          isStage
                            ? "italic text-muted-foreground"
                            : isMeGroup
                            ? "text-foreground"
                            : "text-muted-foreground",
                          // Highlight current dialogue lines (primary)
                          isCurrentGroup &&
                            !isStage &&
                            `rounded-md bg-primary/${OPACITY_LEVELS.subtle} ring-2 ring-primary px-3 py-2`,
                          // Highlight current stage direction lines (yellow overlay)
                          isCurrentGroup &&
                            isStage &&
                            "rounded-md bg-yellow-100/40 px-3 py-2",
                          // Add extra margin for line breaks (verse/poetry spacing)
                          hasLineBreak && "mb-4"
                        )}
                        style={{
                          // Apply indentation using padding-left (1rem per level)
                          paddingLeft:
                            indentLevel > 0 ? `${indentLevel}rem` : undefined,
                        }}
                        ref={isCurrentGroup ? currentGroupRef : undefined}
                      >
                        {!isStage && (
                          <span className="mr-2 flex items-center gap-2">
                            {/* Mastery checkbox to the left of the name */}
                            {isMeGroup && (
                              <span title={`Mastery: ${avgMasteryPct}%`}>
                                <CompletionIcon
                                  progress={isMastered ? 100 : 0}
                                  hasContent={true}
                                  className="h-4 w-4"
                                />
                              </span>
                            )}
                            <strong>{charName}</strong>
                            {isCurrentGroup && (
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary",
                                  `bg-primary/${OPACITY_LEVELS.subtle}`
                                )}
                              >
                                Current
                              </span>
                            )}
                            <span>—</span>
                          </span>
                        )}
                        {isStage ? (
                          <span className="text-sm">{group.text}</span>
                        ) : (
                          group.text
                        )}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
