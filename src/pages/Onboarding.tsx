import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useRegisterPrincipal, useSendOTP, useSendOTPByEmail, useVerifyOTP, useRegisterSchool } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { principalFormSchema, schoolFormSchema, type PrincipalFormData, type SchoolFormData } from "../features/auth/utils/validationSchema";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna"];
const RESEND_COOLDOWN = 30;

export const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepFromUrl = Number(searchParams.get("step")) || 1;
  const [step, setStep] = useState(stepFromUrl);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const principalForm = useForm<PrincipalFormData>({
    resolver: zodResolver(principalFormSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: { name: "", state: "", lga: "", schoolType: "secondary", address: "", schoolCode: "", arms: "" },
  });

  const registerPrincipalMutation = useRegisterPrincipal();
  const sendOTPMutation = useSendOTP();
  const sendOTPEmailMutation = useSendOTPByEmail();
  const verifyOTPMutation = useVerifyOTP();
  const registerSchoolMutation = useRegisterSchool();
  const { user, setTokens, logout } = useAuth();

  useEffect(() => {
    setStep(stepFromUrl);
  }, [stepFromUrl]);

  useEffect(() => {
    if (step !== stepFromUrl) {
      if (step === 1) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ step: String(step) }, { replace: true });
      }
    }
  }, [step]);

  useEffect(() => {
    if (user?.email) {
      principalForm.setValue("email", user.email);
    }
    if (user?.phone) {
      principalForm.setValue("phone", user.phone);
    }
  }, [user?.email, user?.phone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePrincipalSubmit = (data: PrincipalFormData) => {
    registerPrincipalMutation.mutate(
      {
        principalName: data.name,
        principalPhone: data.phone,
        principalEmail: data.email || undefined,
        password: data.password,
      },
      {
        onSuccess: (res) => {
          setPhone(res.phone);
          setCooldown(RESEND_COOLDOWN);
          setStep(2);
        },
      },
    );
  };

  const handleResendOTP = useCallback(() => {
    if (cooldown > 0) return;
    sendOTPMutation.mutate(phone, {
      onSuccess: () => setCooldown(RESEND_COOLDOWN),
    });
  }, [cooldown, phone, sendOTPMutation]);

  const handleResendOTPEmail = useCallback(() => {
    const email = principalForm.getValues("email");
    if (!email || cooldown > 0) return;
    sendOTPEmailMutation.mutate(email, {
      onSuccess: () => setCooldown(RESEND_COOLDOWN),
    });
  }, [cooldown, principalForm, sendOTPEmailMutation]);

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = principalForm.getValues("email");
    if (!email || !otp) return;
    verifyOTPMutation.mutate(
      { email, code: otp },
      {
        onSuccess: (data) => {
          if (!data.accessToken || !data.user) return;
          setTokens(data.accessToken, data.refreshToken, data.user);
          setStep(3);
        },
      },
    );
  };

  const handleSchoolSubmit = (data: SchoolFormData) => {
    registerSchoolMutation.mutate(
      {
        schoolName: data.name,
        state: data.state,
        lga: data.lga,
        schoolType: data.schoolType,
        address: data.address || undefined,
        schoolCode: data.schoolCode || undefined,
        arms: data.arms
          ? data.arms.split(",").map((a) => a.trim()).filter(Boolean)
          : undefined,
      },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
          window.location.href = "/dashboard";
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2 flex-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-2 w-full rounded ${step >= s ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            {user && (
              <button
                type="button"
                onClick={logout}
                className="ml-2 text-xs text-red-400 hover:text-red-600 shrink-0"
              >
                Sign out
              </button>
            )}
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Create Account" : step === 2 ? "Verify Email" : "Register School"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Step 1 — Principal details"
              : step === 2
                ? `Step 2 — Enter the code sent to ${principalForm.getValues("email")}`
                : "Step 3 — School details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={principalForm.handleSubmit(handlePrincipalSubmit)} className="space-y-4">
              {registerPrincipalMutation.isError && (
                <p className="text-sm text-destructive">{(registerPrincipalMutation.error as Error)?.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...principalForm.register("name")} />
                {principalForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{principalForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...principalForm.register("email")} />
                {principalForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{principalForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...principalForm.register("phone")} />
                {principalForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{principalForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...principalForm.register("password")} />
                {principalForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{principalForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" disabled={registerPrincipalMutation.isPending} className="w-full">
                {registerPrincipalMutation.isPending ? "Creating..." : "Next"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              {verifyOTPMutation.isError && (
                <p className="text-sm text-destructive">{(verifyOTPMutation.error as Error)?.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              <Button type="submit" disabled={verifyOTPMutation.isPending} className="w-full">
                {verifyOTPMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                disabled={sendOTPMutation.isPending || cooldown > 0}
                className="w-full text-sm"
              >
                {sendOTPMutation.isPending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend via SMS in ${cooldown}s`
                    : "Resend via SMS"}
              </Button>
              {principalForm.getValues("email") && (
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOTPEmail}
                  disabled={sendOTPEmailMutation.isPending || cooldown > 0}
                  className="w-full text-sm"
                >
                  {sendOTPEmailMutation.isPending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend via email in ${cooldown}s`
                      : "Send to email"}
                </Button>
              )}
            </form>
          )}

          {step === 3 && (
            <form onSubmit={schoolForm.handleSubmit(handleSchoolSubmit)} className="space-y-4">
              {registerSchoolMutation.isError && (
                <p className="text-sm text-destructive">{(registerSchoolMutation.error as Error)?.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" {...schoolForm.register("name")} />
                {schoolForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{schoolForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolCode">School Code <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  id="schoolCode"
                  placeholder="e.g. ATH"
                  maxLength={10}
                  {...schoolForm.register("schoolCode", {
                    onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                  })}
                />
                {schoolForm.formState.errors.schoolCode && (
                  <p className="text-sm text-destructive">{schoolForm.formState.errors.schoolCode.message}</p>
                )}
                <p className="text-xs text-gray-400">Used as prefix for auto-generated admission numbers</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arms">Arms <span className="text-gray-400 font-normal">(optional, comma-separated)</span></Label>
                <Input
                  id="arms"
                  placeholder="e.g. A, B, C or 1, 2, 3"
                  {...schoolForm.register("arms")}
                />
                <p className="text-xs text-gray-400">Defaults to A, B, C if not provided.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  {...schoolForm.register("state")}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {schoolForm.formState.errors.state && (
                  <p className="text-sm text-destructive">{schoolForm.formState.errors.state.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga">LGA</Label>
                <Input id="lga" {...schoolForm.register("lga")} />
                {schoolForm.formState.errors.lga && (
                  <p className="text-sm text-destructive">{schoolForm.formState.errors.lga.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">School Type</Label>
                <select
                  id="schoolType"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  {...schoolForm.register("schoolType")}
                >
                  <option value="secondary">Secondary</option>
                  <option value="primary">Primary</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...schoolForm.register("address")} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full">
                  Back
                </Button>
                <Button type="submit" disabled={registerSchoolMutation.isPending} className="w-full">
                  {registerSchoolMutation.isPending ? "Registering..." : "Complete"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
