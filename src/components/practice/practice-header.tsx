import Link from "next/link";
import { ArrowLeft, Play, Pause, CheckCircle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playbook, Character } from "@/lib/mock-data";

interface PracticeHeaderProps {
  play: Playbook;
  character: Character;
  viewMode: "line" | "book";
  onViewModeChange: (mode: "line" | "book") => void;
  isPaused: boolean;
  onTogglePause: () => void;
  sessionStats: {
    linesRehearsed: number;
    correctLines: number;
    hintsUsed: number;
  };
}

export function PracticeHeader({
  play,
  character,
  viewMode,
  onViewModeChange,
  isPaused,
  onTogglePause,
  sessionStats,
}: PracticeHeaderProps) {
  return (
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
        {/* View mode toggle */}
        <div className="mr-2 flex items-center rounded-md border p-1 text-sm">
          <Button
            variant={viewMode === "line" ? "default" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "line"}
            onClick={() => onViewModeChange("line")}
          >
            Line-by-line
          </Button>
          <Button
            variant={viewMode === "book" ? "default" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "book"}
            onClick={() => onViewModeChange("book")}
          >
            Book
          </Button>
        </div>
        <div className="mr-4 flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> {sessionStats.correctLines}{" "}
            Correct
          </span>
          <span className="flex items-center gap-1">
            <BarChart className="h-3 w-3" /> {sessionStats.linesRehearsed} Total
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onTogglePause}>
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
  );
}
