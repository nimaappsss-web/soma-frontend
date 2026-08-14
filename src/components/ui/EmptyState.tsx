import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
}: EmptyStateProps) => {
  const renderedIcon = isValidElement(icon)
    ? cloneElement(
        icon as ReactElement<{ size?: number; variant?: string }>,
        {
          size: 30,
          ...((icon.props as { variant?: unknown }).variant !== undefined
            ? { variant: "Bold" }
            : {}),
        },
      )
    : icon;

  return (
    <div
      className={cn(
        "flex w-full min-h-[calc(100dvh-190px)] flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
        {renderedIcon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
};