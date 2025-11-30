import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletionIconProps {
  progress: number;
  hasContent: boolean;
  className?: string;
}

export function CompletionIcon({
  progress,
  hasContent,
  className,
}: CompletionIconProps) {
  if (!hasContent) {
    return (
      <Circle className={cn("h-5 w-5 text-muted-foreground", className)} />
    );
  }

  if (progress === 100) {
    return <CheckCircle className={cn("h-5 w-5 text-green-500", className)} />;
  }

  return (
    <CheckCircle className={cn("h-5 w-5 text-muted-foreground", className)} />
  );
}
