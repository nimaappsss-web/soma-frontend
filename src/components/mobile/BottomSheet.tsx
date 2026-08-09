import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ open, onClose, title, children }: BottomSheetProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Sheet panel */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray200" />
        {title && <div className="px-5 pt-3 pb-1 text-lg font-semibold text-gray900">{title}</div>}
        <div className="max-h-[85vh] overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
};
