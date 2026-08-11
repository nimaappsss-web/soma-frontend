import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { Timer } from "iconsax-react";

import { cn } from "@/lib/utils";

interface TimeInputProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}

interface MenuPos {
  btnTop: number;
  btnBottom: number;
  left: number;
  height: number;
  flipped: boolean;
}

const HOURS_12 = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const MENU_WIDTH = 224;

const pad = (n: number) => String(n).padStart(2, "0");

const to12 = (hh: string): { hour12: string; period: "AM" | "PM" } => {
  const h = Number(hh) || 0;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return { hour12: String(hour12), period };
};

const to24 = (hour12: number, period: "AM" | "PM"): number =>
  period === "AM" ? hour12 % 12 : (hour12 % 12) + 12;

const TimeInput = ({
  value = "",
  onChange,
  placeholder = "Select time",
  className,
  hasError,
  disabled,
}: TimeInputProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const inDialog = typeof document !== "undefined" && !!document.querySelector('[role="dialog"]');

  useEffect(() => {
    if (!open || inDialog) return;
    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos((p) => ({
        btnTop: r.top,
        btnBottom: r.bottom,
        left: r.left,
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
    if (!open || inDialog || !pos || pos.flipped) return;
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
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      const el = btnRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({ btnTop: r.top, btnBottom: r.bottom, left: r.left, height: 0, flipped: false });
      }
    }
    setOpen(!open);
  };

  const [hour, minute] = value.split(":");
  const { hour12, period } = to12(hour || "0");

  const pickHour = (h12: string) => onChange?.(`${pad(to24(Number(h12), period))}:${minute || "00"}`);
  const pickMinute = (m: string) => onChange?.(`${pad(to24(Number(hour12), period))}:${m}`);
  const togglePeriod = () =>
    onChange?.(`${pad(to24(Number(hour12), period === "AM" ? "PM" : "AM"))}:${minute || "00"}`);

  const menuStyle: CSSProperties | undefined = pos
    ? {
        top: pos.flipped ? Math.max(4, pos.btnTop - pos.height - 4) : pos.btnBottom + 4,
        left: pos.left,
        width: MENU_WIDTH,
      }
    : undefined;

  const menu = (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-gray500">Hours</p>
        <div className="flex overflow-hidden rounded-full border border-input">
          <button
            type="button"
            onClick={() => togglePeriod()}
            className={cn(
              "px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
              period === "AM" ? "bg-gray900 text-white" : "bg-background text-gray500 hover:bg-accent",
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => togglePeriod()}
            className={cn(
              "px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
              period === "PM" ? "bg-gray900 text-white" : "bg-background text-gray500 hover:bg-accent",
            )}
          >
            PM
          </button>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-6 gap-1.5">
        {HOURS_12.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => pickHour(h)}
            className={cn(
              "rounded-lg py-1.5 text-xs tabular-nums transition-colors",
              value && hour12 === h
                ? "bg-gray900 font-semibold text-white"
                : "bg-gray50 text-gray500 hover:bg-accent hover:text-gray700",
            )}
          >
            {h}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-medium text-gray500">Minutes</p>
      <div className="mt-1.5 grid grid-cols-6 gap-1.5">
        {MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMinute(m)}
            className={cn(
              "rounded-lg py-1.5 text-xs tabular-nums transition-colors",
              value && minute === m
                ? "bg-gray900 font-semibold text-white"
                : "bg-gray50 text-gray500 hover:bg-accent hover:text-gray700",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      {value && (
        <p className="mt-3 border-t border-input pt-2 text-center text-sm font-semibold tabular-nums text-gray900">
          {hour12}:{minute || "00"} {period}
        </p>
      )}
    </div>
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-full border border-input bg-background px-4 text-sm cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          hasError && "border-red-500",
        )}
      >
        <span className={cn("flex-1 truncate text-left", !value && "text-placeholder")}>
          {value ? `${hour12}:${minute || "00"} ${period}` : placeholder}
        </span>
        <Timer size={16} variant="Bold" color="#8C8C8C" className="shrink-0" />
      </button>

      {open &&
        (inDialog ? (
          <div className="absolute z-50 mt-1 w-[224px] rounded-xl border border-input bg-background shadow-lg">
            {menu}
          </div>
        ) : (
          pos &&
          createPortal(
            <div ref={menuRef} style={menuStyle} className="fixed z-[100] rounded-xl border border-input bg-background shadow-lg">
              {menu}
            </div>,
            document.body,
          )
        ))}
    </div>
  );
};

export { TimeInput };
export type { TimeInputProps };