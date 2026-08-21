import { useState, type ReactNode } from "react";
import { ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/utils";

export const StudentListSection = ({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray100 bg-white p-4 text-left transition-colors hover:border-gray200 sm:p-5"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-gray900">{title}</span>
          {meta && <span className="truncate text-xs text-gray500">{meta}</span>}
        </span>
        <ArrowDown2
          size={16}
          color="#0D0D0D"
          className={cn("shrink-0 transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      {open && <div className="mt-2.5 space-y-2.5">{children}</div>}
    </div>
  );
};
