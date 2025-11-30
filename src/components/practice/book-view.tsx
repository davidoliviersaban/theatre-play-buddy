import { cn } from "@/lib/utils";
import type { Line, Playbook } from "@/lib/mock-data";
import { calculateProgress } from "@/components/play/progress-bar";
import React from "react";
import { StructureProgressHeader } from "@/components/practice/structure-header";

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
  masteryLevel?: Line["masteryLevel"]; // worst (lowest) mastery among grouped lines
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
    if (last && last.characterId === line.characterId) {
      last.text = `${last.text} ${line.text}`.trim();
      last.lineIndices.push(globalIndex);
      // update mastery: choose the lowest fidelity (low < medium < high)
      if (last.masteryLevel === "high" && line.masteryLevel !== "high") {
        last.masteryLevel = line.masteryLevel;
      } else if (
        last.masteryLevel === "medium" &&
        line.masteryLevel === "low"
      ) {
        last.masteryLevel = line.masteryLevel;
      }
    } else {
      groups.push({
        characterId: line.characterId,
        text: line.text,
        lineIndices: [globalIndex],
        masteryLevel: line.masteryLevel,
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
  const currentGroupRef = React.useRef<HTMLParagraphElement | null>(null);

  React.useEffect(() => {
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
                    const charName =
                      play.characters.find((c) => c.id === group.characterId)
                        ?.name || "Narration";
                    const isStage = group.characterId === "__stage__";
                    const isMeGroup =
                      !isStage && group.characterId === characterId;
                    const isCurrentGroup =
                      group.lineIndices.includes(currentLineIndex);
                    const mastery = group.masteryLevel;
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
                          isCurrentGroup &&
                            !isStage &&
                            "rounded-md bg-primary/5 ring-2 ring-primary px-3 py-2"
                        )}
                        ref={isCurrentGroup ? currentGroupRef : undefined}
                      >
                        {!isStage && (
                          <span className="mr-2 font-semibold flex items-center gap-2">
                            {charName} —
                            {isMeGroup && mastery && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                                  mastery === "high" &&
                                    "bg-green-500/10 text-green-600 ring-green-600/30",
                                  mastery === "medium" &&
                                    "bg-yellow-500/10 text-yellow-600 ring-yellow-600/30",
                                  mastery === "low" &&
                                    "bg-red-500/10 text-red-600 ring-red-600/30"
                                )}
                                title={`Mastery: ${mastery}`}
                              >
                                {mastery === "high"
                                  ? "Mastered"
                                  : mastery === "medium"
                                  ? "Learning"
                                  : "Practice"}
                              </span>
                            )}
                            {isCurrentGroup && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                Current
                              </span>
                            )}
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
