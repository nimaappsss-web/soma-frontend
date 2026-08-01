import { useEffect, useRef, forwardRef } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

interface TextareaProps extends Omit<React.ComponentProps<"textarea">, "children"> {
  registration?: Partial<UseFormRegisterReturn>;
  hasError?: FieldError;
  autoGrow?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 2, registration, hasError, autoGrow = true, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      if (!autoGrow || !innerRef.current) return;
      const el = innerRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoGrow, props.value]);

    return (
      <>
        <div className="relative">
          <textarea
            ref={setRefs}
            rows={rows}
            className={cn(
              "flex min-h-[60px] w-full rounded-[20px] border border-input bg-background px-4 py-3 text-base placeholder:text-placeholder focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none md:text-sm",
              hasError && "border-red-500",
              className
            )}
            {...registration}
            {...props}
          />
        </div>
        {hasError && (
          <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
        )}
      </>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
