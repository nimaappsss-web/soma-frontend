import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";
import clsx from "clsx";

interface TooltipProps {
  children: React.ReactNode;
  title: string;
  position?: "top" | "right" | "bottom" | "left";
  delay?: number;
  open?: boolean;
  className?: string;
  arrowClassName?: string;
  showArrow?: boolean;
  offset?: number;
}

export const Tooltipper = ({
  children,
  title,
  position = "left",
  delay = 100,
  open,
  showArrow = false,
  className = "bg-white-state text-black text-sm",
  arrowClassName = "",
  offset = 5,
}: TooltipProps) => {
  return (
    <Tooltip.Provider delayDuration={delay}>
      <Tooltip.Root open={open}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side={position}
            sideOffset={offset}
            className={clsx(
              "select-none rounded px-4 py-2 leading-none shadow-md z-50 text-sm bg-gray-3 text-white",
              "data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade",
              "data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade",
              "data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade",
              "data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade",
              className
            )}
          >
            {title}
            {showArrow && (
              <Tooltip.Arrow className={clsx("fill-black", arrowClassName)} />
            )}{" "}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
