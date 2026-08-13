import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { SearchNormal } from "iconsax-react";
import type { CSSProperties } from "react";
import type { FieldError } from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeTone?: "neutral" | "warn" | "taken";
  disabled?: boolean;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: FieldError;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
}

interface MenuPos {
  btnTop: number;
  btnBottom: number;
  left: number;
  width: number;
  height: number;
  flipped: boolean;
}

export const SelectDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  hasError,
  className,
  buttonClassName,
  menuClassName,
  disabled,
  searchable,
}: SelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [pos, setPos] = useState<MenuPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchable) {
      setFilter("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos((p) => ({
        btnTop: r.top,
        btnBottom: r.bottom,
        left: r.left,
        width: r.width,
        height: p?.height ?? 0,
        flipped: p?.flipped ?? false,
      }));
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !pos || pos.flipped) return;
    const el = menuRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (pos.btnBottom + 4 + h > window.innerHeight - 8) {
      setPos((p) => (p ? { ...p, height: h, flipped: true } : p));
    }
  }, [open, pos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(
    () =>
      searchable && filter
        ? options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
        : options,
    [options, filter, searchable],
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollHeight <= el.clientHeight) return;
      const atTop = el.scrollTop <= 0 && e.deltaY <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY >= 0;
      if (atTop || atBottom) return;
      e.preventDefault();
      el.scrollTop += e.deltaY;
    };

    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollHeight <= el.clientHeight || !e.touches[0]) return;
      const delta = lastTouchY - e.touches[0].clientY;
      const atTop = el.scrollTop <= 0 && delta <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && delta >= 0;
      if (atTop || atBottom) return;
      e.preventDefault();
      el.scrollTop += delta;
      lastTouchY = e.touches[0].clientY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    if (!el) return;
    const onFocusIn = (e: FocusEvent) => e.stopPropagation();
    el.addEventListener("focusin", onFocusIn, true);
    return () => el.removeEventListener("focusin", onFocusIn, true);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      const el = btnRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({ btnTop: r.top, btnBottom: r.bottom, left: r.left, width: r.width, height: 0, flipped: false });
      }
    }
    setOpen(!open);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const menuStyle: CSSProperties | undefined = pos
    ? {
        top: pos.flipped ? Math.max(4, pos.btnTop - pos.height - 4) : pos.btnBottom + 4,
        left: pos.left,
        width: pos.width,
      }
    : undefined;

  const menu = (
    <>
      {searchable && (
        <div className="p-2 pb-0">
          <div className="relative">
            <SearchNormal
              size={16}
              color="#B3B3B3"
              variant="Linear"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              className="w-full h-9 rounded-full border border-input bg-background pl-9 pr-4 text-base placeholder:text-placeholder focus-visible:outline-none md:text-sm"
            />
          </div>
        </div>
      )}
      <div ref={scrollRef} className="max-h-60 overflow-y-auto overscroll-contain" style={{ touchAction: "none" }}>
        {filteredOptions.length === 0 ? (
          <p className="p-3 text-sm text-placeholder">No options available</p>
        ) : (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={option.disabled}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-accent",
                option.value === value && "font-medium",
                option.disabled && "cursor-not-allowed text-placeholder opacity-60 hover:bg-transparent",
              )}
            >
              <span className="w-4 shrink-0">
                {option.value === value && (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="flex-1 truncate">{option.label}</span>
              {option.badge && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    option.badgeTone === "warn" || option.badgeTone === "taken"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-accent text-placeholder",
                  )}
                >
                  {option.badge}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between overflow-hidden rounded-full border border-input bg-background px-4 py-2 text-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !value && "text-placeholder",
          hasError && "border-red-500",
          buttonClassName,
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <svg
          className={cn("h-4 w-4 shrink-0 text-placeholder transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[100]">
            <div
              ref={menuRef}
              style={{ ...menuStyle, pointerEvents: "auto" }}
              onPointerDownCapture={(e) => e.stopPropagation()}
              className={cn("absolute rounded-xl border border-input bg-background shadow-lg", menuClassName)}
            >
              {menu}
            </div>
          </div>,
          document.body,
        )}

      {hasError && <p className="text-xs text-red-500 mt-2">{hasError.message}</p>}
    </div>
  );
};
