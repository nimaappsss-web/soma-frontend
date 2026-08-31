import { useState, type ReactNode } from "react";
import { ArrowDown2, ArrowUp2 } from "iconsax-react";

import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  collapsed: ReactNode;
  expanded?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleCard = ({
  collapsed,
  expanded,
  defaultOpen = false,
  className,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const collapsible = !!expanded;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={open}
        aria-disabled={!collapsible}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-4 text-left",
          collapsible ? "cursor-pointer" : "cursor-default",
        )}
      >
        <div className="min-w-0 flex-1">{collapsed}</div>
        {collapsible &&
          (open ? (
            <ArrowUp2 size={16} color="#8C8C8C" variant="Linear" className="shrink-0" />
          ) : (
            <ArrowDown2 size={16} color="#8C8C8C" variant="Linear" className="shrink-0" />
          ))}
      </button>

      {expanded && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-gray-50 p-4">{expanded}</div>
          </div>
        </div>
      )}
    </div>
  );
};
