import {
  SkipBack,
  SkipForward,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticeControlsProps {
  currentLineIndex: number;
  totalLines: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkipScene: () => void;
  onSkipPreviousScene: () => void;
}

export function PracticeControls({
  currentLineIndex,
  totalLines,
  onPrevious,
  onNext,
  onSkipScene,
  onSkipPreviousScene,
}: PracticeControlsProps) {
  return (
    <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
    </div>
  );
}
