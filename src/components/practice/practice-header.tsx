"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft, CheckCircle, BarChart, List, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playbook, Character } from "@/lib/mock-data";

interface PracticeHeaderProps {
  play: Playbook;
  character: Character;
  viewMode: "line" | "book";
  onViewModeChange: (mode: "line" | "book") => void;
  sessionStats: {
    linesRehearsed: number;
    correctLines: number;
    hintsUsed: number;
  };
  isHidden?: boolean;
}

export function PracticeHeader({
  play,
  character,
  viewMode,
  onViewModeChange,
  sessionStats,
  isHidden,
}: PracticeHeaderProps) {
  // Avoid hydration mismatch for dynamic stats by rendering them only on client
  const subscribe = () => () => {};
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;
  const isClient = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const hidden = isHidden
    ? "-translate-y-full opacity-0 pointer-events-none"
    : "translate-y-0 opacity-100";
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-20 border-b bg-background/95 backdrop-blur transition-all duration-300 ${hidden}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title/Character */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10" asChild>
              <Link href={`/play/${play.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{play.title}</h1>
              <p className="text-sm text-muted-foreground">
                Practicing as{" "}
                <span className="font-medium">{character.name}</span>
              </p>
            </div>
          </div>

          {/* Right: View toggle */}
          <div className="flex overflow-hidden rounded-md border">
            <Button
              variant={viewMode === "line" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10"
              aria-pressed={viewMode === "line"}
              aria-label="Line-by-line view"
              onClick={() => onViewModeChange("line")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "book" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10"
              aria-pressed={viewMode === "book"}
              aria-label="Book view"
              onClick={() => onViewModeChange("book")}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats row - render on client to prevent hydration mismatch */}
        {isClient && (
          <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1 mr-3">
              <CheckCircle className="h-3 w-3" /> {sessionStats.correctLines}{" "}
              Correct
            </span>
            <span className="inline-flex items-center gap-1">
              <BarChart className="h-3 w-3" /> {sessionStats.linesRehearsed}{" "}
              Total
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
