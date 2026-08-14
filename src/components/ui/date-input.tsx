import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Calendar as CalendarIcon } from "iconsax-react";

import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";

interface DateInputProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  label?: string;
  registration?: Partial<UseFormRegisterReturn>;
  hasError?: FieldError;
  className?: string;
  disabled?: boolean;
  dropdownAlign?: "left" | "right";
  min?: string;
}

interface MenuPos {
  btnTop: number;
  btnBottom: number;
  left: number;
  width: number;
  height: number;
  flipped: boolean;
}

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const CALENDAR_WIDTH = 280;

const DateInput = ({
  value = "",
  onChange,
  placeholder = "Select date",
  label,
  hasError,
  className,
  disabled,
  dropdownAlign = "left",
  min,
}: DateInputProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (pos.btnBottom + 8 + h > window.innerHeight - 8) {
      setPos((p) => (p ? { ...p, height: h, flipped: true } : p));
    }
  }, [open, pos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    if (!el) return;
    const onFocusIn = (e: FocusEvent) => e.stopPropagation();
    el.addEventListener("focusin", onFocusIn, true);
    return () => el.removeEventListener("focusin", onFocusIn, true);
  }, [open]);

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

  const handleSelect = (date: string) => {
    onChange?.(date);
    setOpen(false);
  };

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : CALENDAR_WIDTH;
  const clampLeft = (left: number) =>
    Math.min(Math.max(8, left), Math.max(8, viewportWidth - CALENDAR_WIDTH - 8));

  const menuStyle: CSSProperties | undefined = pos
    ? {
        top: pos.flipped ? Math.max(4, pos.btnTop - pos.height - 8) : pos.btnBottom + 8,
        left:
          dropdownAlign === "right"
            ? clampLeft(pos.left + pos.width - CALENDAR_WIDTH)
            : clampLeft(pos.left),
        width: CALENDAR_WIDTH,
        pointerEvents: "auto",
      }
    : undefined;

  const calendar = (
    <Calendar
      value={value}
      min={min}
      onChange={handleSelect}
      onClose={() => setOpen(false)}
    />
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className && "w-full")}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-[45px] items-center rounded-[20px] border border-input bg-background px-4 text-sm cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          hasError && "border-red-500",
          className,
        )}
      >
        {label && (
          <span className="text-gray900 font-medium mr-2 shrink-0">{label}</span>
        )}
        <span className={cn("flex-1 truncate text-left", !value && "text-placeholder")}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon variant="Bold" size={16} color="#B3B3B3" className="shrink-0 ml-2" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="fixed z-[100]"
            data-soma-floating
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            {calendar}
          </div>,
          document.body,
        )}
    </div>
  );
};

export { DateInput };
export type { DateInputProps };
