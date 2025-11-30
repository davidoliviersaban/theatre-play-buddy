import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ICON_SIZES } from "@/lib/ui-constants";

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon;
  iconSize?: keyof typeof ICON_SIZES;
  children?: React.ReactNode;
}

export function IconButton({
  icon: Icon,
  iconSize = "sm",
  children,
  asChild,
  ...props
}: IconButtonProps) {
  // When asChild is true and children is provided, we need to clone the child
  // and inject the icon into it to maintain a single React element for Slot
  if (asChild && children) {
    const child = React.Children.only(children);
    const iconElement = <Icon className={`mr-2 ${ICON_SIZES[iconSize]}`} />;
    
    // Clone the child element and prepend the icon to its children
    return (
      <Button asChild {...props}>
        {React.cloneElement(child as React.ReactElement, {}, 
          iconElement,
          (child as React.ReactElement).props.children
        )}
      </Button>
    );
  }

  return (
    <Button asChild={asChild} {...props}>
      <Icon className={`mr-2 ${ICON_SIZES[iconSize]}`} />
      {children}
    </Button>
  );
}
