"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Play,
  Pause,
  SkipForward,
  AlertCircle,
  CheckCircle,
  BarChart,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MOCK_PLAYS, type Line } from "@/lib/mock-data";

export default function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ character: string }>;
}) {
  const { id } = React.use(params);
  const { character: characterParam } = React.use(searchParams);
  const play = MOCK_PLAYS.find((p) => p.id === id) || MOCK_PLAYS[0];
  const characterId = characterParam || play.characters[0]?.id;
  const character = play.characters.find((c) => c.id === characterId);

  // Flatten lines for easier navigation
  const allLines = React.useMemo(() => {
    return play.acts.flatMap((act) =>
      act.scenes.flatMap((scene) => scene.lines)
    );
  }, [play]);

  const [currentLineIndex, setCurrentLineIndex] = React.useState(0);
  const [isListening, setIsListening] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [sessionStats, setSessionStats] = React.useState({
    linesRehearsed: 0,
    correctLines: 0,
    hintsUsed: 0,
  });

  const currentLine = allLines[currentLineIndex];
  const isMyLine = currentLine?.characterId === characterId;

  // Auto-scroll to current line
  const lineRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (lineRefs.current[currentLineIndex]) {
      lineRefs.current[currentLineIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  // Simulate "Reading" other lines
  React.useEffect(() => {
    if (!isPaused && !isMyLine && currentLineIndex < allLines.length) {
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
      }, 2000); // Simulate reading time
      return () => clearTimeout(timeout);
    }
  }, [currentLineIndex, isPaused, isMyLine, allLines.length]);

  // Simulate "Listening" to my line
  React.useEffect(() => {
    if (!isPaused && isMyLine) {
      setIsListening(true);
      // In a real app, this would wait for voice input
      // Here we simulate a successful recitation after 3 seconds
      const timeout = setTimeout(() => {
        setIsListening(false);
        setSessionStats((prev) => ({
          ...prev,
          linesRehearsed: prev.linesRehearsed + 1,
          correctLines: prev.correctLines + 1,
        }));
        setCurrentLineIndex((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setIsListening(false);
    }
  }, [currentLineIndex, isPaused, isMyLine]);

  if (!character) return <div>Character not found</div>;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/play/${play.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{play.title}</h1>
            <p className="text-sm text-muted-foreground">
              Practicing as{" "}
              <span className="font-medium text-foreground">
                {character.name}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-4 flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {sessionStats.correctLines}{" "}
              Correct
            </span>
            <span className="flex items-center gap-1">
              <BarChart className="h-3 w-3" /> {sessionStats.linesRehearsed}{" "}
              Total
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <Play className="mr-2 h-4 w-4" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/practice/${play.id}/summary`}>Finish Session</Link>
          </Button>
        </div>
      </header>

      {/* Script View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {allLines.map((line, index) => {
            const isCurrent = index === currentLineIndex;
            const isMe = line.characterId === characterId;
            const characterName =
              play.characters.find((c) => c.id === line.characterId)?.name ||
              "Unknown";

            return (
              <div
                key={line.id}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className={cn(
                  "relative rounded-lg p-6 transition-all duration-300",
                  isCurrent
                    ? "scale-105 ring-2 ring-primary"
                    : "opacity-50 blur-[1px]",
                  isMe ? "bg-secondary/10" : "bg-transparent"
                )}
              >
                {/* Mastery Indicator (New Feature) */}
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
                      "text-sm font-bold uppercase tracking-wider",
                      isMe ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {characterName}
                  </span>
                  {isMe && (
                    <span className="text-xs text-muted-foreground">
                      Rehearsed: {line.rehearsalCount || 0}x
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "text-lg leading-relaxed",
                    isCurrent && "font-medium"
                  )}
                >
                  {line.text}
                </p>

                {/* Status Indicator for Current Line */}
                {isCurrent && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary animate-pulse">
                    {isMe ? (
                      <>
                        <Mic className="h-4 w-4" /> Listening...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" /> Reading...
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Footer */}
      <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentLineIndex(Math.max(0, currentLineIndex - 1))
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            Line {currentLineIndex + 1} of {allLines.length}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentLineIndex(
                Math.min(allLines.length - 1, currentLineIndex + 1)
              )
            }
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
