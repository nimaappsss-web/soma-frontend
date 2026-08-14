import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HelpHintSection {
  title: string;
  text: string;
  icon?: ReactNode;
}

interface HelpHintProps {
  title: string;
  description?: string;
  sections: HelpHintSection[];
  storageKey: string;
  className?: string;
}

interface Pos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const HIDDEN_PREFIX = "soma:hint:hidden:";

const readHidden = (storageKey: string): boolean => {
  try {
    return localStorage.getItem(`${HIDDEN_PREFIX}${storageKey}`) === "1";
  } catch {
    return false;
  }
};

const writeHidden = (storageKey: string) => {
  try {
    localStorage.setItem(`${HIDDEN_PREFIX}${storageKey}`, "1");
  } catch {
    // ignore storage errors (private mode etc.)
  }
};

export const HelpHint = ({ title, description, sections, storageKey, className }: HelpHintProps) => {
  const [hidden, setHidden] = useState(() => readHidden(storageKey));
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (readHidden(storageKey)) setHidden(true);
  }, [storageKey]);

  const updatePos = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const availableBelow = window.innerHeight - rect.bottom - 16;
    const maxHeight = Math.min(380, Math.max(160, availableBelow));
    setPos({ top: rect.bottom + 6, left, width, maxHeight });
  }, []);

  useEffect(() => {
    if (hidden) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("resize", updatePos);
    };
  }, [hidden, updatePos]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (window.innerWidth >= 768) return;
      const target = event.target as HTMLElement | null;
      const groupEl = triggerRef.current?.closest(".group");
      if (!groupEl || !target) return;
      const inButton = rootRef.current?.contains(target);
      if (groupEl.contains(target) && !inButton) {
        setOpen((o) => !o);
        updatePos();
      }
    };
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("click", onDocClick);
    };
  }, [updatePos]);

  const show = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    updatePos();
    setHovered(true);
  }, [updatePos]);

  const hide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHovered(false), 150);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (window.innerWidth < 768) {
        const groupEl = triggerRef.current?.closest(".group");
        if (groupEl?.contains(target)) return;
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const dismiss = () => {
    writeHidden(storageKey);
    setHidden(true);
  };

  if (hidden) return null;

  const visible = open || hovered;

  return (
    <span ref={rootRef} className={cn("inline-flex shrink-0 items-center", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Help: ${title}`}
        onClick={() => {
          setOpen((o) => !o);
          updatePos();
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-gray900 text-white transition-opacity hover:bg-gray700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray300 focus-visible:ring-offset-1",
          "opacity-0 group-hover:opacity-100",
          visible && "opacity-100",
        )}
      >
        <span className="text-xs font-semibold leading-none">!</span>
      </button>

      {pos && (
        <div
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
          onMouseEnter={show}
          onMouseLeave={hide}
          className={cn(
            "fixed z-50 overflow-y-auto overscroll-contain rounded-xl border border-gray200 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-opacity duration-150",
            "invisible opacity-0",
            "group-hover:visible group-hover:opacity-100",
            visible && "visible opacity-100",
          )}
        >
          <p className="text-sm font-semibold text-gray900">{title}</p>
          {description && <p className="mt-0.5 text-xs text-gray500">{description}</p>}
          <div className="mt-3 space-y-2.5">
            {sections.map((section) => (
              <div key={section.title} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gray900" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray900">{section.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray500">{section.text}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 w-full rounded-md px-3 py-1.5 text-xs text-gray400 transition-colors hover:bg-gray100 hover:text-gray900"
          >
            Don't want to see this
          </button>
        </div>
      )}
    </span>
  );
};