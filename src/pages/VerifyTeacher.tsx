import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAcceptInvite } from "../features/principal/api";
import { useInviteInfo, useSendOTPByEmail, useVerifyOTP } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { completeRegistrationSchema, type CompleteRegistrationFormData } from "../features/auth/utils/validationSchema";
import { Trash } from "iconsax-react";
import { MultiSelect, type SelectOption } from "../components/ui/multi-select";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OtpInputField } from "../components/ui/otp-input";
import { AuthLayout } from "../layouts/AuthLayout";
import { transformError } from "../utils/transformError";
import { API_BASE_URL } from "../lib/axios";
import type { SubjectCache, ClassCache } from "../db/db";

const fetchPublic = async <T,>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return res.json() as T;
  } catch {
    return null;
  }
};

interface AssignmentRow {
  subjectId: string;
  classIds: string[];
}

type Step = "email" | "otp" | "register";

export const VerifyTeacher = () => {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const acceptMutation = useAcceptInvite();
  const sendOTPMutation = useSendOTPByEmail();
  const verifyOTPMutation = useVerifyOTP();

  const [step, setStep] = useState<Step>("email");
  const [assignments, setAssignments] = useState<AssignmentRow[]>([
    { subjectId: "", classIds: [] },
  ]);
  const [formClassId, setFormClassId] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const lastSubmittedOtpRef = useRef("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: { name: "", password: "" },
  });

  const { data: inviteInfo, isLoading: infoLoading } = useInviteInfo(token);
  const schoolId = searchParams.get("schoolId") || inviteInfo?.schoolId || "";

  const { data: subjects } = useQuery({
    queryKey: ["subjects", "public", schoolId],
    queryFn: () => fetchPublic<{ subjects: SubjectCache[] }>(`/subjects?schoolId=${schoolId}`),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
  const subjectList: SubjectCache[] = subjects?.subjects ?? [];

  const { data: classesData } = useQuery({
    queryKey: ["classes", "public", schoolId],
    queryFn: () => fetchPublic<{ classes: ClassCache[] }>(`/classes?schoolId=${schoolId}`),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
  const classList: ClassCache[] = classesData?.classes ?? [];

  const isOpenInvite = inviteInfo?.email === null;

  const subjectOptions: SelectOption[] =
    subjectList.map((s) => ({ value: s.id, label: s.name }));
  const classOptions: SelectOption[] =
    classList.map((c) => ({ value: c.id, label: c.name }));
  const formClassOptions: SelectOption[] = [
    { value: "", label: "Not a class teacher" },
    ...classOptions,
  ];

  useEffect(() => {
    if (inviteInfo && !isOpenInvite) {
      setStep("register");
      setEmail(inviteInfo.email ?? "");
    }
  }, [inviteInfo, isOpenInvite]);

  useEffect(() => {
    if (otp.length === 6 && otp !== lastSubmittedOtpRef.current) {
      lastSubmittedOtpRef.current = otp;
      verifyOTPMutation.mutate(
        { email: email.trim(), code: otp },
        { onSuccess: () => setStep("register") },
      );
    }
  }, [otp, email, verifyOTPMutation]);

  const handleSendOTP = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    sendOTPMutation.mutate(trimmed, {
      onSuccess: () => setStep("otp"),
    });
  };

  const handleAddSubject = () => {
    setAssignments((prev) => [...prev, { subjectId: "", classIds: [] }]);
  };

  const handleRemoveSubject = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index: number, subjectId: string) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, subjectId } : a)),
    );
  };

  const handleClassChange = (index: number, classIds: string[]) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, classIds } : a)),
    );
  };

  const onSubmit = (data: CompleteRegistrationFormData) => {
    if (!token) return;
    setEmailError("");
    if (isOpenInvite && !email.trim()) {
      setEmailError("Email is required");
      return;
    }
    acceptMutation.mutate(
      {
        token,
        name: data.name,
        password: data.password,
        email: isOpenInvite ? email.trim() : undefined,
        assignments: assignments
          .filter((a) => a.subjectId && a.classIds.length > 0)
          .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
        formClassId: formClassId || undefined,
      },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  const acceptError = acceptMutation.error as { response?: { data?: { error?: string } } } | undefined;
  const isDuplicateEmail = acceptError?.response?.data?.error?.includes?.("already exists");

  if (!token) {
    return (
      <AuthLayout>
        <p className="text-sm text-gray-500">No invitation token found in URL.</p>
      </AuthLayout>
    );
  }

  if (infoLoading) {
    return (
      <AuthLayout>
        <p className="text-sm text-gray-400">Loading...</p>
      </AuthLayout>
    );
  }

  if (!schoolId) {
    return (
      <AuthLayout>
        <p className="text-sm text-gray-500">Missing school information in invitation.</p>
      </AuthLayout>
    );
  }

  if (isOpenInvite && step === "email") {
    return (
      <AuthLayout>
        <div className="lg:max-w-85.5">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Join {inviteInfo?.schoolName ?? "Your School"}
            </h1>
            <p className="text-sm text-black/50 mt-2">
              You've been invited as <strong>{inviteInfo?.role.toLowerCase()}</strong> — enter your email to get started.
            </p>
          </div>

          <div className="mt-5.25">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
            />
            {emailError && <p className="text-xs text-red-500 mt-2">{emailError}</p>}
          </div>

          {sendOTPMutation.isError && (
            <p className="text-sm text-destructive mt-5.25">
              {transformError(sendOTPMutation.error)}
            </p>
          )}

          <Button
            type="button"
            disabled={sendOTPMutation.isPending}
            className="w-full mt-5.25"
            onClick={handleSendOTP}
          >
            {sendOTPMutation.isPending ? "Sending OTP..." : "Send OTP"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (isOpenInvite && step === "otp") {
    return (
      <AuthLayout>
        <div className="lg:max-w-85.5">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Join {inviteInfo?.schoolName ?? "Your School"}
            </h1>
            <p className="text-sm text-black/50 mt-2">
              Enter the 6-digit code
            </p>
          </div>

          <div className="mt-5.25">
            <Input type="email" value={email} readOnly className="mb-4" />
            <OtpInputField
              value={otp}
              onChange={setOtp}
              numDigits={6}
              disabled={verifyOTPMutation.isPending}
            />
            {verifyOTPMutation.isPending && (
              <p className="text-xs text-placeholder mt-2 text-center">Verifying code...</p>
            )}
            {verifyOTPMutation.isError && (
              <p className="text-xs text-red-500 mt-2 text-center">
                {transformError(verifyOTPMutation.error)}
              </p>
            )}
          </div>

          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Haven't received an email?{" "}
            </span>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendOTPMutation.isPending || verifyOTPMutation.isPending}
              className="text-sm font-medium underline disabled:opacity-40"
            >
              {sendOTPMutation.isPending ? "Sending..." : "Send again"}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">
            Join {inviteInfo?.schoolName ?? "Your School"}
          </h1>
          <p className="text-sm text-black/50 mt-2">
            {isOpenInvite ? (
              <>Set up your account to start teaching.</>
            ) : inviteInfo ? (
              <>You've been invited as <strong>{inviteInfo.role.toLowerCase()}</strong> — <span className="text-blue-600">{inviteInfo.email}</span></>
            ) : (
              "Set your name, password, and teaching subjects to get started."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {acceptMutation.isError && !isDuplicateEmail && (
            <p className="text-sm text-destructive mt-5.25">
              {(acceptMutation.error as Error)?.message}
            </p>
          )}
          {isDuplicateEmail && (
            <p className="text-sm text-destructive mt-5.25">
              This email is already registered.{" "}
              <Link to="/forgot-password" className="underline">Forgot password?</Link>
            </p>
          )}

          {isOpenInvite && (
            <div className="mt-5.25">
              <Input type="email" value={email} readOnly />
            </div>
          )}

          <Input
            placeholder="Full name"
            registration={register("name")}
            hasError={errors.name}
            className="mt-5.25"
          />

          <Input
            type="password"
            placeholder="Choose a password"
            registration={register("password")}
            hasError={errors.password}
            className="mt-5.25"
          />

          <div className="mt-5.25 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">Subject Assignments</p>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleAddSubject}>
                + Add Subject
              </Button>
            </div>
            {assignments.map((a, i) => (
              <div key={i} className="space-y-3">
                <SelectDropdown
                  options={subjectOptions}
                  value={a.subjectId}
                  onChange={(val) => handleSubjectChange(i, val)}
                  placeholder="Select subject"
                  searchable
                />

                <MultiSelect
                  options={classOptions}
                  selected={a.classIds}
                  onChange={(ids) => handleClassChange(i, ids)}
                  placeholder="Select classes"
                  searchable
                />

                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => handleRemoveSubject(i)}
                  aria-label="Remove subject"
                >
                  <Trash size={16} variant="Bold" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5.25">
            <SelectDropdown
              options={formClassOptions}
              value={formClassId}
              onChange={setFormClassId}
              searchable
            />
          </div>

          <Button type="submit" disabled={acceptMutation.isPending} className="w-full mt-5.25">
            {acceptMutation.isPending ? "Setting up..." : "Accept Invite"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};
