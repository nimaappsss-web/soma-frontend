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
      containerStyle={cn("flex gap-2 justify-center", className)}
      renderInput={(inputProps, index) => (
        <input
          {...inputProps}
          disabled={disabled}
          className={cn(
            "min-w-11 h-11 text-center text-lg font-medium rounded-full border border-input bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      )}
    />
  );
};

export { OtpInputField };
