import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { EmailLookupBadge } from "../../../components/others/EmailLookupBadge";
import { useAuth } from "../../../contexts/AuthContext";
import { useEmailLookup } from "../../../hooks/useEmailLookup";
import { editStudentSchema, type EditStudentFormData } from "../utils/validationSchema";
import { useFailedStudentContact } from "../api/useFailedStudentContact";
import type { Student } from "../types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  classes: SelectOption[];
  isSaving: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "GRADUATED", label: "Graduated" },
];
const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export const StudentFormDialog = ({
  open,
  onOpenChange,
  student,
  classes,
  isSaving,
  onSubmit,
}: StudentFormDialogProps) => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
  });

  useEffect(() => {
    if (!student) return;
    reset({
      name: student.name,
      classId: student.classId,
      gender: student.gender ?? "",
      dateOfBirth: student.dateOfBirth?.split("T")[0] ?? "",
      address: student.address ?? "",
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
      parentEmail: student.parentEmail ?? "",
      status: student.status,
    });
  }, [student, reset]);

  const email = watch("parentEmail") ?? "";
  const { result: emailResult } = useEmailLookup(email, user?.id ?? "", user?.email, student?.id);

  const emailTaken = !!emailResult?.found && emailResult.type === "staff";

  const strip = (data: EditStudentFormData): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    const original: Record<string, unknown> = {
      name: student?.name ?? "",
      classId: student?.classId ?? "",
      gender: student?.gender ?? "",
      dateOfBirth: student?.dateOfBirth?.split("T")[0] ?? "",
      address: student?.address ?? "",
      parentName: student?.parentName ?? "",
      parentPhone: student?.parentPhone ?? "",
      parentEmail: student?.parentEmail ?? "",
      status: student?.status ?? "ACTIVE",
    };
    for (const [key, value] of Object.entries(data)) {
      if ((value ?? "") !== (original[key] ?? "")) {
        payload[key] = value === "" ? null : value;
      }
    }
    return payload;
  };

  const field = (
    label: string,
    name: keyof EditStudentFormData,
    placeholder: string,
    type = "text",
  ) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <Input type={type} {...register(name)} placeholder={placeholder} />
      {errors[name] && (
        <p className="text-xs text-destructive mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );

  const rejectedContact = useFailedStudentContact(student?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="middle">
        <DialogHeader>
          <DialogTitle>{student ? `Edit ${student.name}` : "Edit student"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (emailTaken) return;
            handleSubmit((data) => onSubmit(strip(data)))(e);
          }}
          className="px-6 pb-6 space-y-3"
        >
          {rejectedContact && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700">
                Parent contact wasn't accepted
              </p>
              <p className="text-xs text-red-600 mt-1">
                This contact wasn't saved — it's already linked to an existing
                account. Enter a different parent email or phone above to fix it.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field("Full Name *", "name", "Chidi Okonkwo")}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Class *</label>
              <Controller
                control={control}
                name="classId"
                render={({ field }) => (
                  <SelectDropdown
                    placeholder="Select class"
                    options={classes}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.classId && (
                <p className="text-xs text-destructive mt-1">{errors.classId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gender</label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <SelectDropdown
                    placeholder="Select"
                    options={GENDER_OPTIONS}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            {field("Date of Birth", "dateOfBirth", "", "date")}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SelectDropdown
                    options={STATUS_OPTIONS}
                    value={field.value ?? "ACTIVE"}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            {field("Address", "address", "15 Awolowo Road, Ikoyi")}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              Parent/Guardian
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field("Parent Name", "parentName", "Mr. Okonkwo")}
            {field("Parent Phone", "parentPhone", "08012345678", "tel")}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Email</label>
              <Input type="email" {...register("parentEmail")} placeholder="okonkwo@email.com" />
              {errors.parentEmail && (
                <p className="text-xs text-destructive mt-1">{errors.parentEmail.message}</p>
              )}
              {emailResult && emailResult.found && (
                <EmailLookupBadge result={emailResult} />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving || emailTaken} className="flex-1">
              {isSaving ? "Saving..." : "Update"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};