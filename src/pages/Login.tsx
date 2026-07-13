import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../contexts/AuthContext";
import { useLogin, useSendOTPByEmail, useVerifyOTP } from "../features/auth/api";
import { getPostAuthPath } from "../features/auth/utils/routing";
import {
  loginPasswordSchema,
  loginSendOTPSchema,
  loginVerifyOTPSchema,
  type LoginPasswordFormData,
  type LoginSendOTPFormData,
  type LoginVerifyOTPFormData,
} from "../features/auth/utils/validationSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Login = () => {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const sendOTPMutation = useSendOTPByEmail();
  const verifyOTPMutation = useVerifyOTP();

  const passwordForm = useForm<LoginPasswordFormData>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { email: "", password: "" },
  });

  const sendOTPForm = useForm<LoginSendOTPFormData>({
    resolver: zodResolver(loginSendOTPSchema),
    defaultValues: { email: "" },
  });

  const verifyOTPForm = useForm<LoginVerifyOTPFormData>({
    resolver: zodResolver(loginVerifyOTPSchema),
    defaultValues: { otp: "" },
  });

  const handlePasswordSubmit = (data: LoginPasswordFormData) => {
    loginMutation.mutate(
      { identifier: data.email, password: data.password, deviceId: "web-1", deviceName: navigator.userAgent },
      {
        onSuccess: (res) => {
          login(res);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const handleSendOTP = (data: LoginSendOTPFormData) => {
    sendOTPMutation.mutate(data.email, {
      onSuccess: () => setOtpSent(true),
    });
  };

  const handleVerifyOTP = (data: LoginVerifyOTPFormData) => {
    const email = sendOTPForm.getValues("email");
    if (!email) return;
    verifyOTPMutation.mutate(
      { email, code: data.otp },
      {
        onSuccess: (res) => {
          login(res);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">Soma</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => { setMode("password"); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "password" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => { setMode("otp"); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "otp" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            OTP
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            {loginMutation.isError && (
              <p className="text-sm text-red-500">{(loginMutation.error as Error)?.message || "Login failed"}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="teacher@school.com" {...passwordForm.register("email")} />
              {passwordForm.formState.errors.email && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loginMutation.isPending} className="w-full">
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={sendOTPForm.handleSubmit(handleSendOTP)} className="space-y-4">
                {sendOTPMutation.isError && (
                  <p className="text-sm text-red-500">{(sendOTPMutation.error as Error)?.message}</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input id="otp-email" type="email" placeholder="teacher@school.com" {...sendOTPForm.register("email")} />
                  {sendOTPForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{sendOTPForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={sendOTPMutation.isPending} className="w-full">
                  {sendOTPMutation.isPending ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOTPForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                {verifyOTPMutation.isError && (
                  <p className="text-sm text-red-500">{(verifyOTPMutation.error as Error)?.message}</p>
                )}

                <p className="text-sm text-gray-500">
                  Enter the code sent to <strong>{sendOTPForm.getValues("email")}</strong>
                </p>

                <div className="space-y-2">
                  <Label htmlFor="otp-code">OTP Code</Label>
                  <Input id="otp-code" placeholder="Enter 6-digit code" {...verifyOTPForm.register("otp")} />
                  {verifyOTPForm.formState.errors.otp && (
                    <p className="text-sm text-destructive">{verifyOTPForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={verifyOTPMutation.isPending} className="w-full">
                  {verifyOTPMutation.isPending ? "Verifying..." : "Sign In"}
                </Button>
              </form>
            )}
          </div>
        )}

        <div className="text-center space-y-1 text-sm">
          <Link to="/onboarding" className="text-blue-600 hover:underline block">
            Register your school
          </Link>
          {mode === "password" && (
            <Link to="/forgot-password" className="text-gray-400 hover:underline text-xs block">
              Forgot password?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
