import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  useCheckIdentifier,
  useLogin,
  useSendOTPByEmail,
  useVerifyOTP,
} from "../features/auth/api";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { transformError } from "../utils/transformError";
import { AuthLayout } from "../layouts/AuthLayout";
import { Button } from "../components/ui/button";
import { ErrorMessage } from "../components/others/ErrorMessage";
import {
  EmailForm,
  type EmailFormHandle,
} from "../features/auth/components/EmailForm";
import { PasswordForm } from "../features/auth/components/PasswordForm";
import { OtpForm } from "../features/auth/components/OtpForm";

export const Login = () => {
  const [step, setStep] = useState<"email" | "password" | "otp">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [identifierInfo, setIdentifierInfo] = useState<{
    name?: string;
  } | null>(null);
  const emailFormRef = useRef<EmailFormHandle>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const checkIdentifier = useCheckIdentifier();
  const loginMutation = useLogin();
  const sendOTPMutation = useSendOTPByEmail();
  const verifyOTPMutation = useVerifyOTP();

  const isPasswordStep = step === "password";
  const isOTPStep = step === "otp";
  const isEmailStep = step === "email";
  const isOTPSent = otpSent;

  const loginError = loginMutation.error as { response?: { status?: number } } | null;
  const isEmailUnverified = loginMutation.isError && loginError?.response?.status === 403;

  const currentError = isEmailStep
    ? checkIdentifier.isError
      ? transformError(checkIdentifier.error)
      : null
    : isPasswordStep
      ? loginMutation.isError
        ? transformError(loginMutation.error)
        : null
      : isOTPStep
        ? verifyOTPMutation.isError
          ? transformError(verifyOTPMutation.error)
          : null
        : null;
  const modeToggleLabel = isOTPStep
    ? "Log in with password"
    : "Log in with OTP";

  const handleToggleMode = () => {
    if (isOTPStep) {
      setStep("email");
      setOtpSent(false);
    } else {
      emailFormRef.current?.submitOTP();
    }
  };

  const handleEmailSubmit = (data: { email: string }) => {
    setIdentifier(data.email);
    checkIdentifier.mutate(
      { identifier: data.email },
      {
        onSuccess: (res) => {
          setIdentifierInfo(res);
          if (res.exists && res.hasPassword) {
            setStep("password");
          } else if (res.exists && !res.hasPassword) {
            sendOTPMutation.mutate(data.email, {
              onSuccess: () => {
                setStep("otp");
                setOtpSent(true);
              },
            });
          }
        },
      },
    );
  };

  const handleSendOTP = (data: { email: string }) => {
    setIdentifier(data.email);
    setIdentifierInfo({});
    sendOTPMutation.mutate(data.email, {
      onSuccess: () => {
        setOtpSent(true);
        setStep("otp");
      },
    });
  };

  const handlePasswordSubmit = (data: { email: string; password: string }) => {
    loginMutation.mutate(
      {
        identifier: data.email,
        password: data.password,
        deviceId: "web-1",
        deviceName: navigator.userAgent,
      },
      {
        onSuccess: (res) => {
          login(res);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const handleVerifyOTP = (data: { otp: string }) => {
    if (!identifier) return;
    verifyOTPMutation.mutate(
      { email: identifier, code: data.otp },
      {
        onSuccess: (res) => {
          login(res);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const handleSendAgain = () => {
    sendOTPMutation.mutate(identifier);
  };

  const handleVerifyEmail = () => {
    if (!identifier) return;
    sendOTPMutation.mutate(identifier, {
      onSuccess: () => {
        navigate(`/onboarding?step=2&email=${encodeURIComponent(identifier)}`);
      },
    });
  };

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        {currentError && (
          <div className="mb-4">
            <ErrorMessage
              action={isEmailUnverified ? (
                <Button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={sendOTPMutation.isPending}
                  size="sm"
                >
                  {sendOTPMutation.isPending ? "Sending verification..." : "Verify email"}
                </Button>
              ) : undefined}
            >
              {currentError}
            </ErrorMessage>
          </div>
        )}

        <div>
          {!isEmailStep && identifierInfo?.name ? (
            <>
              <h1 className="text-2xl font-medium text-gray-900">
                Welcome back, {identifierInfo.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-black/50 mt-2">
                Enter your password or use OTP to log in.
              </p>
            </>
          ) : !isEmailStep ? (
            <>
              <h1 className="text-2xl font-medium text-gray-900">Welcome back</h1>
              <p className="text-sm text-black/50 mt-2">
                Enter your password or use OTP to log in.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-medium text-gray-900">Log in</h1>
              <p className="text-sm text-black/50 mt-2">
                Enter email to access your school's account.
              </p>
            </>
          )}
        </div>

        {isEmailStep && (
          <EmailForm
            ref={emailFormRef}
            onSubmit={handleEmailSubmit}
            onSendOTP={handleSendOTP}
            isPending={checkIdentifier.isPending}
          />
        )}

        {isPasswordStep && (
          <PasswordForm
            onSubmit={handlePasswordSubmit}
            isPending={loginMutation.isPending}
            identifier={identifier}
          />
        )}

        {isOTPStep && isOTPSent && (
          <OtpForm
            onSubmit={handleVerifyOTP}
            onSendAgain={handleSendAgain}
            isPending={verifyOTPMutation.isPending}
            identifier={identifier}
          />
        )}

        {isEmailStep && (
          <div className="text-center mt-4 h-fit">
            <button
              type="button"
              onClick={handleToggleMode}
              disabled={sendOTPMutation.isPending}
              className="text-sm inline-block underline disabled:opacity-50"
            >
              {sendOTPMutation.isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Log in with OTP"
              )}
            </button>
          </div>
        )}

        {isOTPStep && (
          <div className="text-center mt-4 h-fit">
            <Button
              type="button"
              variant="link"
              onClick={handleToggleMode}
              className="text-sm"
            >
              {modeToggleLabel}
            </Button>
          </div>
        )}

        <div className="relative mt-4 mb-4.25">
          <div className="absolute inset-0 flex items-center">
            <div className="w-[90%] mx-auto border-t border-white" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-offWhite px-3 text-gray-400">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full text-black/30 bg-pureWhite flex items-center justify-center gap-2.5"
        >
          <img src="/icons/googleIcon.svg" alt="Google" className="w-4 h-4" />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-gray-500 mt-5.25">
          Don't have an account?{" "}
          <Link
            to="/onboarding"
            className="text-gray-900 font-medium underline hover:text-gray-700"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
