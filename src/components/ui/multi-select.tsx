import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import type { FieldError } from "react-hook-form";
import { X } from "lucide-react";

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
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
  hasError,
}: MultiSelectProps) => {
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

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
                <X size={14} />
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

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-input bg-background shadow-lg">
          {options.length === 0 ? (
            <p className="p-3 text-sm text-placeholder">No options available</p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent"
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
      )}

      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </div>
  );
};
