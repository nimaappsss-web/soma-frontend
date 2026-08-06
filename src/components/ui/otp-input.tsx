import OtpInput from "react-otp-input";

import { cn } from "@/lib/utils";

interface OtpInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  numDigits?: number;
  disabled?: boolean;
  className?: string;
}

const OtpInputField = ({ value, onChange, numDigits = 6, disabled, className }: OtpInputFieldProps) => {
  return (
    <OtpInput
      value={value}
      onChange={onChange}
      numInputs={numDigits}
      inputType="text"
      containerStyle={cn("flex gap-2.5 sm:gap-3 justify-center", className)}
      renderInput={(inputProps, _index) => (
        <input
          {...inputProps}
          disabled={disabled}
          className={cn(
            "flex-1 aspect-square max-w-12 text-center text-lg font-medium rounded-full border border-gray-300 bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      )}
    />
  );
};

export { OtpInputField };
