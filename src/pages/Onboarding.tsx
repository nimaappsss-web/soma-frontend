import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { transformError } from "../utils/transformError";
import { AuthLayout } from "../layouts/AuthLayout";
import { Input } from "../components/ui/input";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { MultiSelect } from "../components/ui/multi-select";
import { TagInput } from "../components/ui/tag-input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { OtpInputField } from "../components/ui/otp-input";
import { ErrorMessage } from "../components/others/ErrorMessage";
import { useRegisterPrincipal, useSendOTP, useSendOTPByEmail, useVerifyOTP, useRegisterSchool } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { principalFormSchema, schoolFormSchema, type PrincipalFormData, type SchoolFormData } from "../features/auth/utils/validationSchema";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna"];
const RESEND_COOLDOWN = 30;

export const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepFromUrl = Number(searchParams.get("step")) || 1;
  const emailFromUrl = searchParams.get("email") || "";
  const [step, setStep] = useState(stepFromUrl);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const principalForm = useForm<PrincipalFormData>({
    resolver: zodResolver(principalFormSchema),
    defaultValues: { name: "", email: emailFromUrl, phone: "", password: "" },
  });

  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: { name: "", state: "", lga: "", schoolType: ["primary"], address: "", schoolCode: "", arms: [] },
  });

  const registerPrincipalMutation = useRegisterPrincipal();
  const sendOTPMutation = useSendOTP();
  const sendOTPEmailMutation = useSendOTPByEmail();
  const verifyOTPMutation = useVerifyOTP();
  const registerSchoolMutation = useRegisterSchool();
  const { user, setTokens } = useAuth();

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

  useEffect(() => {
    if (otp.length === 6) {
      const email = principalForm.getValues("email");
      if (!email) return;
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
    }
  }, [otp]);

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
        arms: data.arms?.length ? data.arms : undefined,
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
    <AuthLayout reverse>
      <div className="lg:max-w-85.5">
        {registerPrincipalMutation.isError && (
          <div className="mb-4">
            <ErrorMessage>{transformError(registerPrincipalMutation.error)}</ErrorMessage>
          </div>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Create Account</h1>
              <p className="text-sm text-black/50 mt-2">Step 1 — Principal details</p>
            </div>

            <div className="mt-5.25 flex gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-black" : "bg-white"}`} />
              ))}
            </div>

            <form onSubmit={principalForm.handleSubmit(handlePrincipalSubmit)} className="mt-5.25 space-y-5">
              <div>
                <Input
                  type="text"
                  placeholder="Full name"
                  registration={principalForm.register("name")}
                  hasError={principalForm.formState.errors.name}
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  registration={principalForm.register("email")}
                  hasError={principalForm.formState.errors.email}
                />
              </div>
              <div>
                <Input
                  type="tel"
                  placeholder="Phone"
                  registration={principalForm.register("phone")}
                  hasError={principalForm.formState.errors.phone}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  showPasswordToggle
                  registration={principalForm.register("password")}
                  hasError={principalForm.formState.errors.password}
                />
              </div>

              <Button type="submit" disabled={registerPrincipalMutation.isPending} className="w-full">
                {registerPrincipalMutation.isPending ? "Creating..." : "Next"}
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Verify Email</h1>
              <p className="text-sm text-black/50 mt-2">
                Step 2 — Enter the code sent to {principalForm.getValues("email")}
              </p>
            </div>

            {verifyOTPMutation.isError && (
              <div className="mt-5.25 mb-4">
                <ErrorMessage>{transformError(verifyOTPMutation.error)}</ErrorMessage>
              </div>
            )}

            <div className="mt-5.25">
              <OtpInputField
                value={otp}
                onChange={(val) => setOtp(val)}
                numDigits={6}
              />
            </div>

            <Button type="submit" disabled={verifyOTPMutation.isPending} className="w-full mt-5.25">
              {verifyOTPMutation.isPending ? "Verifying..." : "Verify"}
            </Button>

            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                Didn't get the code?{" "}
              </span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={sendOTPMutation.isPending || cooldown > 0}
                className="text-sm font-medium underline"
              >
                {sendOTPMutation.isPending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend via SMS in ${cooldown}s`
                    : "Resend via SMS"}
              </button>
            </div>

            {principalForm.getValues("email") && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendOTPEmail}
                  disabled={sendOTPEmailMutation.isPending || cooldown > 0}
                  className="text-sm underline"
                >
                  {sendOTPEmailMutation.isPending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend via email in ${cooldown}s`
                      : "Send to email"}
                </button>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Register School</h1>
              <p className="text-sm text-black/50 mt-2">Step 3 — School details</p>
            </div>

            <form onSubmit={schoolForm.handleSubmit(handleSchoolSubmit)} className="mt-5.25 space-y-5">
              {registerSchoolMutation.isError && (
                <div className="mb-4">
                  <ErrorMessage>{transformError(registerSchoolMutation.error)}</ErrorMessage>
                </div>
              )}

              <div>
                <Input
                  type="text"
                  placeholder="School name"
                  registration={schoolForm.register("name")}
                  hasError={schoolForm.formState.errors.name}
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="School code (e.g. ATH)"
                  maxLength={10}
                  registration={schoolForm.register("schoolCode", {
                    onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                  })}
                  hasError={schoolForm.formState.errors.schoolCode}
                />
                <p className="text-xs text-placeholder mt-1.5">Prefix for auto-generated admission numbers</p>
              </div>
              <div>
                <Controller
                  name="arms"
                  control={schoolForm.control}
                  render={({ field, fieldState }) => (
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Type arm and press Enter (e.g. A)"
                    />
                  )}
                />
                <p className="text-xs text-placeholder mt-1.5">Press Enter or comma after each arm. Defaults to A, B, C if not provided.</p>
              </div>
              <div>
                <Controller
                  name="state"
                  control={schoolForm.control}
                  render={({ field, fieldState }) => (
                    <SelectDropdown
                      options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select state"
                      hasError={fieldState.error}
                    />
                  )}
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="LGA"
                  registration={schoolForm.register("lga")}
                  hasError={schoolForm.formState.errors.lga}
                />
              </div>
              <div>
                <Label>School Type</Label>
                <div className="mt-2">
                  <Controller
                    name="schoolType"
                    control={schoolForm.control}
                    render={({ field, fieldState }) => (
                      <MultiSelect
                        options={[
                          { value: "creche", label: "Creche" },
                          { value: "kg", label: "Kindergarten" },
                          { value: "primary", label: "Primary" },
                          { value: "secondary", label: "Secondary" },
                        ]}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select school type"
                        hasError={fieldState.error}
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Address"
                  registration={schoolForm.register("address")}
                />
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
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-5.25">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-900 font-medium underline hover:text-gray-700">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
