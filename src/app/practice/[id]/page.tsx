"use client";

import * as React from "react";
import { MOCK_PLAYS } from "@/lib/mock-data";
import { usePracticeSession } from "@/hooks/use-practice-session";
import { PracticeHeader } from "@/components/practice/practice-header";
import { LineByLineView } from "@/components/practice/line-by-line-view";
import { BookView } from "@/components/practice/book-view";
import { PracticeControls } from "@/components/practice/practice-controls";

export default function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ character: string; mode?: string }>;
}) {
  const { id } = React.use(params);
  const { character: characterParam, mode } = React.use(searchParams);
  const play = MOCK_PLAYS.find((p) => p.id === id) || MOCK_PLAYS[0];
  const characterId = characterParam || play.characters[0]?.id;
  const character = play.characters.find((c) => c.id === characterId);

  const {
    allLines,
    currentLineIndex,
    isPaused,
    sessionStats,
    lineRefs,
    goToPrevious,
    goToNext,
    skipToNextScene,
    skipToPreviousScene,
    togglePause,
  } = usePracticeSession(play, characterId);

  const [viewMode, setViewMode] = React.useState<"line" | "book">(
    mode === "book" ? "book" : "line"
  );

  // Ensure centering scroll happens when switching back to line view
  React.useEffect(() => {
    if (viewMode === "line" && lineRefs.current[currentLineIndex]) {
      lineRefs.current[currentLineIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [viewMode, currentLineIndex, lineRefs]);

  if (!character) return <div>Character not found</div>;

  return (
    <div className="flex h-screen flex-col bg-background">
      <PracticeHeader
        play={play}
        character={character}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isPaused={isPaused}
        onTogglePause={togglePause}
        sessionStats={sessionStats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {viewMode === "line" ? (
          <LineByLineView
            lines={allLines}
            currentLineIndex={currentLineIndex}
            characterId={characterId}
            play={play}
            lineRefs={lineRefs}
          />
        ) : (
          <BookView
            play={play}
            characterId={characterId}
            lines={allLines}
            currentLineIndex={currentLineIndex}
            viewMode={viewMode}
          />
        )}
      </div>

      <PracticeControls
        currentLineIndex={currentLineIndex}
        totalLines={allLines.length}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onSkipScene={skipToNextScene}
        onSkipPreviousScene={skipToPreviousScene}
      />
    </div>
  );
}
