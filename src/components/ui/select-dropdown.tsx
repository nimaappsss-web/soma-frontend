import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
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
  searchable?: boolean;
}

export const SelectDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  hasError,
  className,
  disabled,
  searchable,
}: SelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchable) {
      setFilter("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
          {searchable && (
            <div className="p-2 pb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-placeholder pointer-events-none" />
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
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-accent",
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
        </div>
      )}

      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </div>
  );
};
