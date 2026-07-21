import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { FieldError } from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: FieldError;
  className?: string;
  disabled?: boolean;
}

export const SelectDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  hasError,
  className,
  disabled,
}: SelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          !value && "text-placeholder",
          hasError && "border-red-500",
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

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-input bg-background shadow-lg">
          {options.length === 0 ? (
            <p className="p-3 text-sm text-placeholder">No options available</p>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent",
                  option.value === value && "font-medium",
                )}
              >
                <span className="w-4 shrink-0">
                  {option.value === value && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {option.label}
              </button>
            ))
          )}
        </div>
      )}

      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </div>
  );
};
