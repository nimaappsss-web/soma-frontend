import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FieldError } from "react-hook-form";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  hasError?: FieldError;
  className?: string;
  disabled?: boolean;
}

export const TagInput = ({
  value,
  onChange,
  placeholder = "Type and press Enter",
  hasError,
  className,
  disabled,
}: TagInputProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().toUpperCase();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("\n")) {
      e.preventDefault();
      const tags = text
        .split(/[, \n]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      if (tags.length > 0) {
        onChange([...value, ...tags.filter((t) => !value.includes(t))]);
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex items-center flex-wrap gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 min-h-11 cursor-text",
          hasError && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              disabled={disabled}
              className="hover:text-black/70"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none py-1 text-base md:text-sm placeholder:text-placeholder"
        />
      </div>
      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </div>
  );
};
