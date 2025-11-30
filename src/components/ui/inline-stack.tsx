import { cn } from "@/lib/utils";

interface InlineStackProps extends React.HTMLAttributes<HTMLSpanElement> {
  gap?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

/**
 * Utility component for inline flex layouts with consistent spacing
 * Replaces repeated pattern: inline-flex items-center gap-X
 */
export function InlineStack({ gap = 1, children, className, ...props }: InlineStackProps) {
  return (
    <span className={cn("inline-flex items-center", `gap-${gap}`, className)} {...props}>
      {children}
    </span>
  );
}
