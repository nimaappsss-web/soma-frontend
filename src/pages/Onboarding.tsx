import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

import { Step1Email } from "../features/auth/components/Step1Email";
import { Step2OTP } from "../features/auth/components/Step2OTP";
import { Step3Profile } from "../features/auth/components/Step3Profile";
import {
  useStartRegistration,
  useVerifyRegistrationOTP,
  useCompleteProfile,
  useGoogleAuth,
} from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { transformError } from "../utils/transformError";

const RESEND_COOLDOWN = 30;

export const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStep = Number(searchParams.get("step")) || 1;
  const savedEmail = searchParams.get("email") || "";

  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(savedEmail);
  const [otp, setOtp] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const updateStep = (newStep: number, extras?: Record<string, string>) => {
    setStep(newStep);
    const params: Record<string, string> = { step: String(newStep) };
    if (extras) Object.assign(params, extras);
    setSearchParams(params);
  };

  const startRegistrationMutation = useStartRegistration();
  const verifyOTPMutation = useVerifyRegistrationOTP();
  const completeProfileMutation = useCompleteProfile();
  const googleAuthMutation = useGoogleAuth();
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (otp.length === 6) {
      verifyOTPMutation.mutate(
        { email, code: otp },
        {
          onSuccess: (data) => {
            setRegistrationToken(data.registrationToken);
            updateStep(3, { email });
          },
        },
      );
    }
  }, [otp]);

  const handleEmailSubmit = (data: { email: string }) => {
    setEmail(data.email);
    startRegistrationMutation.mutate(
      { email: data.email },
      {
        onSuccess: () => {
          setCooldown(RESEND_COOLDOWN);
          updateStep(2, { email: data.email });
        },
      },
    );
  };

  const handleResend = useCallback(() => {
    if (cooldown > 0) return;
    startRegistrationMutation.mutate(
      { email },
      { onSuccess: () => setCooldown(RESEND_COOLDOWN) },
    );
  }, [cooldown, email, startRegistrationMutation]);

  const handleVerify = () => {
    if (otp.length === 6) {
      verifyOTPMutation.mutate(
        { email, code: otp },
        {
          onSuccess: (data) => {
            setRegistrationToken(data.registrationToken);
            updateStep(3, { email });
          },
        },
      );
    }
  };

  const handleProfileSubmit = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
  }) => {
    if (!registrationToken) return;
    completeProfileMutation.mutate(
      {
        registrationToken,
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        password: data.password,
      },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const handleGoBackToOTP = () => {
    completeProfileMutation.reset();
    setOtp("");
    setRegistrationToken("");
    updateStep(2, { email });
    startRegistrationMutation.mutate(
      { email },
      { onSuccess: () => setCooldown(RESEND_COOLDOWN) },
    );
  };

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    googleAuthMutation.mutate(
      { idToken: credentialResponse.credential, deviceId: "web-1", deviceName: navigator.userAgent },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const triggerGoogleLogin = () => {
    const btn = googleBtnRef.current?.querySelector("div[role='button']") as HTMLElement | null;
    btn?.click();
  };

  const profileError = completeProfileMutation.error;
  const profileErrorMessage = profileError ? transformError(profileError) : null;
  const isTokenError = profileErrorMessage?.toLowerCase().includes("registration token");

  const stepError =
    startRegistrationMutation.error ||
    verifyOTPMutation.error ||
    profileError;

  const errorMessage = stepError ? transformError(stepError) : null;

  if (step === 1) {
    return (
      <>
        <Step1Email
          onSubmit={handleEmailSubmit}
          onGoogleClick={triggerGoogleLogin}
          isPending={startRegistrationMutation.isPending}
          error={errorMessage}
        />
        <div ref={googleBtnRef} className="absolute opacity-0 pointer-events-none overflow-hidden w-0 h-0">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google sign-in failed")}
          />
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <Step2OTP
        email={email}
        otp={otp}
        onOtpChange={setOtp}
        onVerify={handleVerify}
        onResend={handleResend}
        isPending={verifyOTPMutation.isPending}
        isResending={startRegistrationMutation.isPending}
        cooldown={cooldown}
        error={errorMessage}
      />
    );
  }

  return (
    <Step3Profile
      email={email}
      onSubmit={handleProfileSubmit}
      isPending={completeProfileMutation.isPending}
      error={isTokenError ? null : errorMessage}
      errorActionMessage={isTokenError ? profileErrorMessage ?? undefined : undefined}
      errorAction={isTokenError ? (
        <button onClick={handleGoBackToOTP} className="text-sm font-medium underline">
          Verify email again
        </button>
      ) : undefined}
    />
  );
};
