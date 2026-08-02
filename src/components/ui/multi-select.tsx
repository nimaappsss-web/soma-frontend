import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { SearchNormal, CloseCircle } from "iconsax-react";
import type { CSSProperties } from "react";
import type { FieldError } from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  hasError?: FieldError;
  searchable?: boolean;
}

interface MenuPos {
  left: number;
  width: number;
  btnTop: number;
  btnBottom: number;
  height: number;
  flipped: boolean;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
  hasError,
  searchable,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [pos, setPos] = useState<MenuPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inDialog = typeof document !== "undefined" && !!document.querySelector('[role="dialog"]');

  useEffect(() => {
    if (open && searchable) {
      setFilter("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !inDialog) return;
    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos((p) => ({
        left: r.left,
        width: r.width,
        btnTop: r.top,
        btnBottom: r.bottom,
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
  }, [open, inDialog]);

  useLayoutEffect(() => {
    if (!open || !inDialog || !pos || pos.flipped) return;
    const el = menuRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (pos.btnBottom + 4 + h > window.innerHeight - 8) {
      setPos((p) => (p ? { ...p, height: h, flipped: true } : p));
    }
  }, [open, inDialog, pos]);

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

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const remove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as SelectOption[];

  const handleToggle = () => {
    if (!open) {
      const el = btnRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({
          left: r.left,
          width: r.width,
          btnTop: r.top,
          btnBottom: r.bottom,
          height: 0,
          flipped: false,
        });
      }
    }
    setOpen(!open);
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
            <SearchNormal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-placeholder pointer-events-none" variant="Bold" />
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              className="w-full h-9 rounded-full border border-input bg-background pl-9 pr-4 text-sm placeholder:text-placeholder focus-visible:outline-none"
            />
          </div>
        </div>
      )}
      <div className="max-h-60 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <p className="p-3 text-sm text-placeholder">No options available</p>
        ) : (
          filteredOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="h-4 w-4 rounded border-gray-300 accent-black"
              />
              {option.label}
            </label>
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
        className={cn(
          "flex w-full items-center flex-wrap gap-1.5 rounded-full border border-input bg-background px-4 py-2.5 text-base focus-visible:outline-none md:text-sm min-h-11 cursor-pointer",
          selected.length === 0 && "h-11",
          hasError && "border-red-500",
        )}
      >
        {selected.length === 0 ? (
          <span className="text-placeholder">{placeholder}</span>
        ) : (
          selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-sm"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => remove(opt.value, e)}
                className="hover:text-black/70"
              >
                <CloseCircle size={14} variant="Bold" color="currentColor" />
              </button>
            </span>
          ))
        )}
        <span className="ml-auto shrink-0">
          <svg
            className={cn("h-4 w-4 text-placeholder transition-transform", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open &&
        (inDialog ? (
          pos &&
          createPortal(
            <div
              ref={menuRef}
              onPointerDownCapture={(e) => e.stopPropagation()}
              style={{ ...menuStyle, pointerEvents: "auto" }}
              className="fixed z-[100] rounded-xl border border-input bg-background shadow-lg"
            >
              {menu}
            </div>,
            document.body,
          )
        ) : (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-input bg-background shadow-lg">
            {menu}
          </div>
        ))}

      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </div>
  );
};
