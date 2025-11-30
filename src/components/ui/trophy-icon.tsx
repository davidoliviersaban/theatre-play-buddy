import { cn } from "@/lib/utils";
import Image from "next/image";

interface TrophyIconProps {
  className?: string;
  variant?: "silver" | "gold";
  title?: string;
}

export function TrophyIcon({
  className,
  variant = "silver",
  title,
}: TrophyIconProps) {
  return (
    <Image
      src={variant === "gold" ? "/trophy-gold.png" : "/trophy-silver.png"}
      alt={title || "Trophy Icon"}
      width={36}
      height={36}
      className={cn("inline-block", className)}
    />
  );
}
