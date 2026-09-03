import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../../../components/ui/input";
import { DateInput } from "../../../components/ui/date-input";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { Button } from "../../../components/ui/button";
import { EmailLookupBadge } from "../../../components/others/EmailLookupBadge";
import { useAuth } from "../../../contexts/AuthContext";
import { useEmailLookup } from "../../../hooks/useEmailLookup";
import type { CreateStudentPayload } from "../types";
import { buildGuardianName } from "../../../utils/guardianName";

const phoneRegex = /^\+?(0[789][01]\d{8}|234[789][01]\d{8}|[789][01]\d{8})$/;

const contactRules = (data: {
  parentPhone?: unknown;
  parentEmail?: unknown;
}, ctx: z.RefinementCtx) => {
  const phone = String(data.parentPhone ?? "").trim();
  const email = String(data.parentEmail ?? "").trim();

  // A parent must be reachable: require a phone when no email is provided.
  if (!email && !phone) {
    ctx.addIssue({
      code: "custom",
      path: ["parentPhone"],
      message: "A parent phone or email is required so the parent can be reached.",
    });
  }

  // Validate phone format (Nigerian) when provided.
  if (phone && !phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
    ctx.addIssue({
      code: "custom",
      path: ["parentPhone"],
      message: "Invalid phone number. Use a valid Nigerian number (e.g. 08123456789 or +2348123456789).",
    });
  }
};

const addStudentSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    classId: z.string().min(1, "Class is required"),
    gender: z.enum(["M", "F"]).optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]).optional(),
    address: z.string().optional().or(z.literal("")),
    parentTitle: z.string().optional().or(z.literal("")),
    parentName: z.string().optional().or(z.literal("")),
    parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    parentPhone: z.string().optional().or(z.literal("")),
  })
  .superRefine(contactRules);

type AddStudentFormData = z.infer<typeof addStudentSchema>;

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: SelectOption[];
  isSaving: boolean;
  onSubmit: (payload: CreateStudentPayload) => void;
}

const genderOptions: SelectOption[] = [
  { value: "", label: "Gender" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const statusOptions: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "GRADUATED", label: "Graduated" },
];

const titleOptions: SelectOption[] = [
  { value: "", label: "Title" },
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
  { value: "Alhaji", label: "Alhaji" },
  { value: "Chief", label: "Chief" },
];

export const AddStudentDialog = ({
  open,
  onOpenChange,
  classes,
  isSaving,
  onSubmit,
}: AddStudentDialogProps) => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      classId: "",
      gender: "",
      dateOfBirth: "",
      status: "ACTIVE",
      address: "",
      parentTitle: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
    },
  });

  const email = watch("parentEmail") ?? "";
  const { result: emailResult } = useEmailLookup(email, user?.id ?? "", user?.email);

  const emailTaken = !!emailResult?.found && emailResult.type === "staff";

  useEffect(() => {
    if (open) {
      reset();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, reset]);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onFormSubmit = async (data: AddStudentFormData) => {
    if (emailTaken) return;
    const payload: CreateStudentPayload = {
      name: `${data.firstName} ${data.lastName}`.trim(),
      classId: data.classId,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
      parentName: buildGuardianName(data.parentTitle ?? "", data.parentName ?? ""),
      parentPhone: data.parentPhone || undefined,
      parentEmail: data.parentEmail || undefined,
    };
    await onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pureWhite">
      {/* Top border line */}
      <div className="h-px w-full bg-gray-200" />

      {/* Fixed close button - independent of form */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed left-[52px] top-[81px] z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray900 text-gray900 hover:bg-gray900 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Fixed save button - independent of form */}
      <div className="fixed right-[52px] top-[81px] z-10">
        <Button
          type="submit"
          form="add-student-form"
          disabled={isSaving || emailTaken}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto bg-offWhite">
        <div className="mx-auto max-w-[706px] px-[52px] pt-[81px] pb-8">
          {/* Title */}
          <h1 className="text-[32px] font-semibold text-gray-900">Student Profile</h1>
          <p className="text-sm text-gray500 mt-0.5 mb-8">Manage this student's basic info.</p>

          {/* Form */}
          <form
            id="add-student-form"
            onSubmit={handleSubmit(onFormSubmit)}
          >
            {/* Student Details */}
            <p className="text-xs font-semibold text-gray900 uppercase tracking-wide mb-4">
              Student Details
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <Input
                  placeholder="First name"
                  registration={register("firstName")}
                  hasError={errors.firstName}
                />
              </div>
              <div>
                <Input
                  placeholder="Last name"
                  registration={register("lastName")}
                  hasError={errors.lastName}
                />
              </div>

              <Controller
                control={control}
                name="classId"
                render={({ field }) => (
                  <SelectDropdown
                    options={[{ value: "", label: "Class" }, ...classes]}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={errors.classId}
                  />
                )}
              />

              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <SelectDropdown
                    options={genderOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field }) => (
                  <DateInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Date of Birth"
                    hasError={errors.dateOfBirth}
                    className="w-full"
                  />
                )}
              />

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SelectDropdown
                    options={statusOptions}
                    value={field.value ?? "ACTIVE"}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="sm:col-span-2">
                <Input
                  placeholder="Address"
                  registration={register("address")}
                  hasError={errors.address}
                />
              </div>
            </div>

            {/* Parent / Guardian */}
            <p className="text-xs font-semibold text-gray900 uppercase tracking-wide mb-4">
              Parent / Guardian
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="parentTitle"
                render={({ field }) => (
                  <SelectDropdown
                    options={titleOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />

              <div>
                <Input
                  placeholder="Guardian Full Name"
                  registration={register("parentName")}
                  hasError={errors.parentName}
                />
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  registration={register("parentEmail")}
                  hasError={errors.parentEmail}
                />
                {errors.parentEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.parentEmail.message}</p>
                )}
                {emailResult && emailResult.found && (
                  <EmailLookupBadge result={emailResult} />
                )}
              </div>

              <div>
                <div className="flex h-11 w-full rounded-full border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                  <div className="flex items-center gap-1.5 border-r border-input px-3">
                    <span className="text-base">🇳🇬</span>
                    <span className="text-sm text-gray600">+234</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="flex-1 bg-transparent px-3 text-base placeholder:text-placeholder focus-visible:outline-none md:text-sm"
                    {...register("parentPhone")}
                  />
                </div>
                {errors.parentPhone && (
                  <p className="text-xs text-red-500 mt-1">{errors.parentPhone.message}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
