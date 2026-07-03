import { useState, useEffect, useCallback } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useRegisterPrincipal, useSendOTP, useVerifyOTP, useRegisterSchool } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";

interface PrincipalForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface SchoolForm {
  name: string;
  state: string;
  lga: string;
  schoolType: string;
  address: string;
}

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna"];
const RESEND_COOLDOWN = 30;

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [principal, setPrincipal] = useState<PrincipalForm>({
    name: "", email: "", phone: "", password: "",
  });
  const [otp, setOtp] = useState("");
  const [school, setSchool] = useState<SchoolForm>({
    name: "", state: "", lga: "", schoolType: "secondary", address: "",
  });
  const [cooldown, setCooldown] = useState(0);

  const registerPrincipalMutation = useRegisterPrincipal();
  const sendOTPMutation = useSendOTP();
  const verifyOTPMutation = useVerifyOTP();
  const registerSchoolMutation = useRegisterSchool();
  const { setTokens } = useAuth();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePrincipalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerPrincipalMutation.mutate(
      {
        principalName: principal.name,
        principalPhone: principal.phone,
        principalEmail: principal.email || undefined,
        password: principal.password,
      },
      {
        onSuccess: (data) => {
          setPhone(data.phone);
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

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOTPMutation.mutate(
      { phone, code: otp },
      { onSuccess: (data) => {
          setTokens(data.accessToken, data.user);
          setStep(3);
        }},
    );
  };

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerSchoolMutation.mutate(
      {
        schoolName: school.name,
        state: school.state,
        lga: school.lga,
        schoolType: school.schoolType,
        address: school.address || undefined,
      },
      { onSuccess: (data) => {
          setTokens(data.accessToken, data.user);
          window.location.href = "/dashboard";
        }},
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-full rounded ${step >= s ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Create Account" : step === 2 ? "Verify Phone" : "Register School"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Step 1 — Principal details"
              : step === 2
                ? `Step 2 — Enter the code sent to ${phone}`
                : "Step 3 — School details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handlePrincipalSubmit} className="space-y-4">
              {registerPrincipalMutation.isError && (
                <p className="text-sm text-destructive">{(registerPrincipalMutation.error as Error)?.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={principal.name}
                  onChange={(e) => setPrincipal({ ...principal, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={principal.email}
                  onChange={(e) => setPrincipal({ ...principal, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={principal.phone}
                  onChange={(e) => setPrincipal({ ...principal, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={principal.password}
                  onChange={(e) => setPrincipal({ ...principal, password: e.target.value })}
                  required
                />
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
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSchoolSubmit} className="space-y-4">
              {registerSchoolMutation.isError && (
                <p className="text-sm text-destructive">{(registerSchoolMutation.error as Error)?.message}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={school.state}
                  onChange={(e) => setSchool({ ...school, state: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga">LGA</Label>
                <Input
                  id="lga"
                  value={school.lga}
                  onChange={(e) => setSchool({ ...school, lga: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">School Type</Label>
                <select
                  id="schoolType"
                  value={school.schoolType}
                  onChange={(e) => setSchool({ ...school, schoolType: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="secondary">Secondary</option>
                  <option value="primary">Primary</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={school.address}
                  onChange={(e) => setSchool({ ...school, address: e.target.value })}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
