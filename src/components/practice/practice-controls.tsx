import {
  SkipBack,
  SkipForward,
  ChevronsRight,
  ChevronsLeft,
  ArrowLeft,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PracticeControlsProps {
  currentLineIndex: number;
  totalLines: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkipScene: () => void;
  onSkipPreviousScene: () => void;
  isHidden?: boolean;
  onUserInteract?: () => void;
  playId: string;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function PracticeControls({
  currentLineIndex,
  totalLines,
  onPrevious,
  onNext,
  onSkipScene,
  onSkipPreviousScene,
  isHidden,
  onUserInteract,
  playId,
  isPaused,
  onTogglePause,
}: PracticeControlsProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 border-t backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        isHidden
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100 bg-background/95 p-4 pb-[env(safe-area-inset-bottom)]"
      }`}
      onClick={onUserInteract}
      onTouchStart={onUserInteract}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
        {/* Skip to previous scene */}
        <Button
          variant="outline"
          size="icon"
          aria-label="Skip to previous scene"
          onClick={onSkipPreviousScene}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Skip to previous scene</span>
        </Button>
        {/* Previous line */}
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous line"
          onClick={onPrevious}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          Line {currentLineIndex + 1} of {totalLines}
        </div>
        {/* Next line */}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next line"
          onClick={onNext}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        {/* Skip to next scene */}
        <Button
          variant="outline"
          size="icon"
          aria-label="Skip to next scene"
          onClick={onSkipScene}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Skip to next scene</span>
        </Button>
      </div>

      {/* Secondary row: Back, Pause/Resume, Finish */}
      <div className="mx-auto mt-3 flex max-w-3xl items-center justify-center gap-2">
        <Button variant="outline" size="icon" className="h-10 w-10" asChild>
          <Link href={`/play/${playId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="secondary"
          className="h-10 flex-1"
          onClick={onTogglePause}
        >
          {isPaused ? (
            <Play className="mr-2 h-4 w-4" />
          ) : (
            <Pause className="mr-2 h-4 w-4" />
          )}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button variant="default" className="h-10 flex-1" asChild>
          <Link href={`/practice/${playId}/summary`}>Finish</Link>
        </Button>
      </div>
    </div>
  );
}
