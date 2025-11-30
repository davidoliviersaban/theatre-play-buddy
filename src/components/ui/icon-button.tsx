import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ICON_SIZES } from "@/lib/ui-constants";

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon;
  iconSize?: keyof typeof ICON_SIZES;
  children: React.ReactNode;
}

export function IconButton({
  icon: Icon,
  iconSize = "sm",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button {...props}>
      <Icon className={`mr-2 ${ICON_SIZES[iconSize]}`} />
      {children}
    </Button>
  );
}
