import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  defaultCountry?: Country;
  className?: string;
  disabled?: boolean;
}

const PhoneInputField = ({ className, defaultCountry = "NG" as Country, onChange, ...props }: PhoneInputProps) => {
  return (
    <PhoneInput
      international
      defaultCountry={defaultCountry}
      onChange={(val) => onChange?.(val as string)}
      className={cn(
        "flex h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-base placeholder:text-placeholder focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
};

export { PhoneInputField };
