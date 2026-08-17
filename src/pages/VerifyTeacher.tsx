import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAcceptInvite } from "../features/principal/api";
import { useInviteInfo, useSendOTPByEmail, useVerifyRegistrationOTP } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { completeRegistrationSchema, type CompleteRegistrationFormData } from "../features/auth/utils/validationSchema";
import { Trash, ArrowLeft2 } from "iconsax-react";
import { motion } from "motion/react";
import { MultiSelect, type SelectOption } from "../components/ui/multi-select";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OtpInputField } from "../components/ui/otp-input";
import { WarningBanner } from "../components/others/WarningBanner";
import { AuthLayout } from "../layouts/AuthLayout";
import { SomaLoader } from "../components/ui/SomaLoader";
import { cn } from "../lib/utils";
import { transformError } from "../utils/transformError";
import { API_BASE_URL } from "../lib/axios";
import type { SubjectCache, ClassCache } from "../db/db";
import type { ClassSubjectAssignment } from "../features/class-subjects/types";
import { subjectIdsForClasses } from "../features/class-subjects/utils/subjectsForClasses";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const acceptMutation = useAcceptInvite();
  const sendOTPMutation = useSendOTPByEmail();
  const verifyRegistrationOTPMutation = useVerifyRegistrationOTP();

  const urlStep = searchParams.get("step");
  const initialStep: Step =
    urlStep === "otp" || urlStep === "register" || urlStep === "email" ? urlStep : "email";
  const [step, setStep] = useState<Step>(initialStep);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([
    { subjectId: "", classIds: [] },
  ]);
  const [formClassId, setFormClassId] = useState("");
  const [formConflict, setFormConflict] = useState<{
    classId: string;
    className: string;
    teacherName: string;
  } | null>(null);
  const [alertFlash, setAlertFlash] = useState(0);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const lastSubmittedOtpRef = useRef("");
  const registrationTokenRef = useRef("");

  const goToStep = useCallback(
    (next: Step, nextEmail?: string) => {
      setStep(next);
      if (nextEmail !== undefined) setEmail(nextEmail);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("step", next);
        if (nextEmail !== undefined) {
          if (nextEmail) params.set("email", nextEmail);
          else params.delete("email");
        }
        return params;
      });
    },
    [setSearchParams],
  );

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

  const { data: classSubjectsData } = useQuery({
    queryKey: ["class-subjects", "public", schoolId],
    queryFn: () =>
      fetchPublic<{ classes: ClassSubjectAssignment[] }>(`/subject-assignments?schoolId=${schoolId}`),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
  const classSubjectList: ClassSubjectAssignment[] = classSubjectsData?.classes ?? [];

  const isOpenInvite = inviteInfo?.email === null;
  const inviteRole = (inviteInfo?.role ?? "").toUpperCase();
  const isNonTeaching = inviteRole === "BURSAR" || inviteRole === "STAFF";

  const subjectOptions: SelectOption[] =
    subjectList.map((s) => ({ value: s.id, label: s.name }));
  const classOptions: SelectOption[] =
    classList.map((c) => ({ value: c.id, label: c.name }));

  const availableSubjects = (classIds: string[], current: string): SelectOption[] => {
    if (classIds.length === 0) return subjectOptions;
    const allowed = subjectIdsForClasses(classSubjectList, classIds);
    const list = subjectOptions.filter((o) => allowed.has(o.value));
    if (current && !list.some((o) => o.value === current)) {
      const cur = subjectList.find((s) => s.id === current);
      if (cur) list.push({ value: cur.id, label: cur.name });
    }
    return list;
  };
  const formClassOptions: SelectOption[] = [
    { value: "", label: "Not a class teacher" },
    ...classList.map((c) => ({
      value: c.id,
      label: c.name,
      badge: c.formTeacher?.name,
      badgeTone: (c.formTeacher ? "taken" : undefined) as "taken" | undefined,
      disabled: !!c.formTeacher,
    })),
  ];

  useEffect(() => {
    if (inviteInfo && !isOpenInvite) {
      goToStep("register", inviteInfo.email ?? "");
    }
  }, [inviteInfo, isOpenInvite, goToStep]);

  useEffect(() => {
    if (otp.length === 6 && otp !== lastSubmittedOtpRef.current) {
      lastSubmittedOtpRef.current = otp;
      verifyRegistrationOTPMutation.mutate(
        { email: email.trim(), code: otp },
        {
          onSuccess: (data) => {
            registrationTokenRef.current = data.registrationToken;
            goToStep("register");
          },
        },
      );
    }
  }, [otp, email, verifyRegistrationOTPMutation, goToStep]);

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
      onSuccess: () => goToStep("otp", trimmed),
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

  const handleFormClassChange = (classId: string) => {
    setFormClassId(classId);
    if (!classId) {
      setFormConflict(null);
      return;
    }
    const cls = classList.find((c) => c.id === classId);
    if (cls?.formTeacher?.name) {
      setFormConflict({
        classId,
        className: cls.name,
        teacherName: cls.formTeacher.name,
      });
      return;
    }
    setFormConflict(null);
  };

  const acceptFormConflict = () => {
    if (formConflict) setFormClassId(formConflict.classId);
    setFormConflict(null);
  };

  const declineFormConflict = () => {
    setFormConflict((prev) =>
      prev
        ? { ...prev }
        : prev,
    );
  };

  const onSubmit = (data: CompleteRegistrationFormData) => {
    if (!token) return;
    if (formConflict) {
      setAlertFlash((n) => n + 1);
      return;
    }
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
        assignments: isNonTeaching
          ? undefined
          : assignments
              .filter((a) => a.subjectId && a.classIds.length > 0)
              .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
        formClassId: isNonTeaching ? undefined : formClassId || undefined,
        registrationToken: isOpenInvite ? registrationTokenRef.current : undefined,
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
        <div className="flex justify-center py-8">
          <SomaLoader descriptions={["Fetching your invitation...", "Preparing your school setup..."]} />
        </div>
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
          <button
            type="button"
            onClick={() => goToStep("email", "")}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95 mb-5"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
          </button>
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
              disabled={verifyRegistrationOTPMutation.isPending}
            />
            {verifyRegistrationOTPMutation.isPending && (
              <p className="text-xs text-placeholder mt-2 text-center">Verifying code...</p>
            )}
            {verifyRegistrationOTPMutation.isError && (
              <p className="text-xs text-red-500 mt-2 text-center">
                {transformError(verifyRegistrationOTPMutation.error)}
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
              disabled={sendOTPMutation.isPending || verifyRegistrationOTPMutation.isPending}
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
              <>Set up your account to get started.</>
            ) : inviteInfo ? (
              <>You've been invited as <strong>{inviteInfo.role.toLowerCase()}</strong> — <span className="text-blue-600">{inviteInfo.email}</span></>
            ) : (
              "Set your name and password to get started."
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

          {!isNonTeaching && (
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
                  options={availableSubjects(a.classIds, a.subjectId)}
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

                {a.classIds.length > 0 && availableSubjects(a.classIds, a.subjectId).length === 0 && (
                  <p className="text-xs text-amber500">
                    No subjects have been assigned to the selected classes yet. Choose different classes or ask the
                    principal to assign subjects.
                  </p>
                )}

                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => handleRemoveSubject(i)}
                  aria-label="Remove subject"
                >
                  <Trash size={16} variant="Linear" color="#FFFFFF" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isNonTeaching && (
          <div className="mt-5.25">
            <SelectDropdown
              options={formClassOptions}
              value={formClassId}
              onChange={handleFormClassChange}
              searchable
            />
          </div>
        )}

          {!isNonTeaching && formConflict && (
            <motion.div
              key={alertFlash}
              initial={{ x: 0 }}
              animate={
                alertFlash > 0
                  ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="mt-3"
            >
              <WarningBanner
                title={`${formConflict.teacherName} is already the class teacher of ${formConflict.className}. Do you want to continue?`}
                className={cn(
                  alertFlash > 0 &&
                    "!border-red-500 ring-2 ring-red-500/20 focus-within:ring-red-500/30",
                )}
              >
                <div className="flex gap-3 mt-3 max-w-[280px]">
                  <Button type="button" className="flex-1" onClick={acceptFormConflict}>
                    Yes, continue
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={declineFormConflict}>
                    No
                  </Button>
                </div>
              </WarningBanner>
            </motion.div>
          )}

          <Button type="submit" disabled={acceptMutation.isPending} className="w-full mt-5.25">
            {acceptMutation.isPending ? "Setting up..." : "Accept Invite"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};
