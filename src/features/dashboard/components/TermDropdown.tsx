import { useState, useRef, useEffect } from "react";
import { ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/utils";
interface TermOption {
  value: string;
  label: string;
}
interface TermDropdownProps {
  options: TermOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
export const TermDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select term",
  className,
}: TermDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center h-[45px] rounded-[20px] border border-gray200 bg-white px-4 text-sm gap-2 min-w-[220px]"
      >
        <span className={cn("flex-1 text-left truncate", !selected && "text-placeholder")}>
          {selected?.label || placeholder}
        </span>
        <ArrowDown2
          variant="Bold"
          size={12}
          className={cn("text-gray400 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "absolute z-50 mt-1 w-full rounded-xl border border-gray200 bg-white shadow-lg max-h-60 overflow-y-auto transition-all duration-200 origin-top",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        )}
      >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray50",
                option.value === value && "font-medium bg-gray50",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
    </div>
  );
};
