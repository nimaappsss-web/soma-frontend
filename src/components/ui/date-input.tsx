import { useState } from "react";
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
}

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const DateInput = ({
  value = "",
  onChange,
  placeholder = "Select date",
  label,
  hasError,
  className,
  disabled,
}: DateInputProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-11 items-center rounded-full border border-input bg-background px-4 text-sm cursor-pointer",
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
        <CalendarIcon variant="Bold" size={16} className="text-gray400 shrink-0 ml-2" />
      </button>

      <div
        className={cn(
          "absolute z-50 top-full mt-2 left-0 transition-all duration-200 origin-top-left",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        )}
      >
        <Calendar
          value={value}
          onChange={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
};

export { DateInput };
export type { DateInputProps };
