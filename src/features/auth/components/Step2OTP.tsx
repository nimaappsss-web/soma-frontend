import { Link } from "react-router";

import { Button } from "../../../components/ui/button";
import { OtpInputField } from "../../../components/ui/otp-input";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { transformError } from "../../../utils/transformError";
import { SignupLayout } from "../../../layouts/SignupLayout";

interface Step2OTPProps {
  email: string;
  otp: string;
  onOtpChange: (val: string) => void;
  onVerify: () => void;
  onResend: () => void;
  isPending: boolean;
  isResending: boolean;
  cooldown: number;
  error: React.ReactNode;
}

export const Step2OTP = ({
  email,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  isPending,
  isResending,
  cooldown,
  error,
}: Step2OTPProps) => {
  return (
    <SignupLayout>
      <div className="w-full">
        <div className="flex justify-center">
          <img
            src="/icons/somawordmark_black.svg"
            alt="Soma"
            className="h-[30px] w-auto mb-8"
          />
        </div>

        <div className="text-center">
          <h1 className="text-[24px] mx-auto text-center font-light text-gray-900 leading-snug min-w-[464px]">
            Activate your account
          </h1>
        </div>

        {error && (
          <div className="mt-5">
            <ErrorMessage>
              {transformError(error) as React.ReactNode}
            </ErrorMessage>
          </div>
        )}

        <div className="mt-2 w-[342px] mx-auto">
          <p className="text-sm text-black/50 mt-2">
            We've sent an email to <span className="font-bold">{email}.</span>{" "}
            Check your inbox to activate your account and get started.
          </p>

          <div className="mt-6 bg-offWhite rounded-lg px-4 py-3">
            <span className="text-sm text-gray-700">{email}</span>
          </div>

          <div className="mt-6">
            <OtpInputField value={otp} onChange={onOtpChange} numDigits={6} />
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              Haven't received an email?{" "}
            </span>
            <button
              type="button"
              onClick={onResend}
              disabled={isResending || cooldown > 0}
              className="text-sm font-medium underline"
            >
              {isResending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Send again"}
            </button>
          </div>

          <Button
            type="button"
            disabled={isPending}
            className="w-full mt-6"
            onClick={onVerify}
          >
            {isPending ? "Verifying..." : "Verify"}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-gray-900 font-medium underline hover:text-gray-700"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </SignupLayout>
  );
};
