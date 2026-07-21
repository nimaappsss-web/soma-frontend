import { useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, "children"> {
  registration?: Partial<UseFormRegisterReturn>;
  hasError?: FieldError;
  showPasswordToggle?: boolean;
}

const Input = ({ className, type, registration, hasError, showPasswordToggle, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const showToggle = isPassword && showPasswordToggle;

  return (
    <>
      <div className="relative">
        <input
          type={showToggle && showPassword ? "text" : type}
          className={cn(
            "flex h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-placeholder focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showToggle && "pr-12",
            hasError && "border-red-500",
            className
          )}
          {...registration}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 mt-2">{hasError.message}</p>
      )}
    </>
  );
}

export { Input }
