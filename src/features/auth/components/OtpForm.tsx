import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { OtpInputField } from "../../../components/ui/otp-input";
import {
  loginVerifyOTPSchema,
  type LoginVerifyOTPFormData,
} from "../utils/validationSchema";

interface OtpFormProps {
  onSubmit: (data: LoginVerifyOTPFormData) => void;
  onSendAgain: () => void;
  isPending: boolean;
  identifier: string;
}

export const OtpForm = ({ onSubmit, onSendAgain, isPending, identifier }: OtpFormProps) => {
  const form = useForm<LoginVerifyOTPFormData>({
    resolver: zodResolver(loginVerifyOTPSchema),
    defaultValues: { otp: "" },
  });

  const otpValue = form.watch("otp");

  useEffect(() => {
    if (otpValue.length === 6) {
      form.handleSubmit(onSubmit)();
    }
  }, [otpValue]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-sm text-gray-500 mt-4">
        Enter the 6-digit verification code sent to your email.
      </p>

      <div className="mt-5.25">
        <Input
          type="email"
          value={identifier}
          readOnly
          className="mb-4"
        />
        <OtpInputField
          value={form.watch("otp")}
          onChange={(val) => form.setValue("otp", val)}
          numDigits={6}
        />
        {form.formState.errors.otp && (
          <p className="text-xs text-red-500 mt-2 text-center">
            {form.formState.errors.otp.message}
          </p>
        )}
      </div>

      <div className=" mt-4">
        <span className="text-sm text-gray-500">
          Haven't received an email?{" "}
        </span>
        <button
          type="button"
          onClick={onSendAgain}
          className="text-sm font-medium underline"
        >
          Send again
        </button>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full mt-5.25"
      >
        {isPending ? "Verifying..." : "Verify"}
      </Button>
    </form>
  );
};
