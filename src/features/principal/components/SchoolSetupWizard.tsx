import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { TagInput } from "../../../components/ui/tag-input";
import { MultiSelect } from "../../../components/ui/multi-select";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { useRegisterSchool } from "../../auth/api";
import { useAuth } from "../../../contexts/AuthContext";
import { transformError } from "../../../utils/transformError";
import { SCHOOL_TYPES, SCHOOL_TYPE_LABELS, type SchoolType } from "../../../utils/schoolType";

const SCHOOL_TYPE_OPTIONS: Array<{ value: string; label: string }> = SCHOOL_TYPES.map((value) => ({
  value,
  label: SCHOOL_TYPE_LABELS[value],
}));

const schoolSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  state: z.string().min(2, "State is required"),
  lga: z.string().min(2, "LGA is required"),
  address: z.string().optional(),
  schoolType: z.array(z.enum(SCHOOL_TYPES)).min(1, "Select at least one school type"),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export const SchoolSetupWizard = () => {
  const [arms, setArms] = useState<string[]>([]);
  const registerSchool = useRegisterSchool();
  const { setTokens } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { schoolName: "", state: "", lga: "", address: "", schoolType: [], bankName: "", accountName: "", accountNumber: "" },
  });

  const schoolType = watch("schoolType");

  const onSubmit = (data: SchoolFormData) => {
    const hasBank = data.bankName?.trim() || data.accountName?.trim() || data.accountNumber?.trim();
    registerSchool.mutate(
      {
        schoolName: data.schoolName,
        state: data.state,
        lga: data.lga,
        schoolType: data.schoolType,
        address: data.address || undefined,
        arms: arms,
        manualBankDetails: hasBank
          ? {
              bankName: data.bankName?.trim() || undefined,
              accountName: data.accountName?.trim() || undefined,
              accountNumber: data.accountNumber?.trim() || undefined,
            }
          : undefined,
      },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto p-6 pb-10">
        <h2 className="text-xl font-semibold text-gray-900">Set Up Your School</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete these details to get started.
        </p>

        {registerSchool.error && (
          <div className="mt-4">
            <ErrorMessage>{transformError(registerSchool.error)}</ErrorMessage>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Input
              type="text"
              placeholder="School name"
              registration={register("schoolName")}
              hasError={errors.schoolName}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="State"
              registration={register("state")}
              hasError={errors.state}
            />
            <Input
              type="text"
              placeholder="LGA"
              registration={register("lga")}
              hasError={errors.lga}
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Address (optional)"
              registration={register("address")}
              hasError={errors.address}
            />
          </div>
          <div>
            <MultiSelect
              options={SCHOOL_TYPE_OPTIONS}
              selected={schoolType}
              onChange={(values) =>
                setValue("schoolType", values as SchoolType[], { shouldValidate: true })
              }
              placeholder="Select school type"
              hasError={errors.schoolType as unknown as import("react-hook-form").FieldError}
            />
          </div>
          <div>
            <TagInput
              value={arms}
              onChange={setArms}
              placeholder="Type arm and press Enter (e.g. A, B, C)"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">Bank account (optional)</p>
            <p className="text-xs text-gray-500 mb-3">
              Where parents send fees by transfer. You can add this later in Settings.
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Bank name (e.g. First Bank)"
                registration={register("bankName")}
                hasError={errors.bankName}
              />
              <Input
                type="text"
                placeholder="Account name (e.g. Jerimiah College)"
                registration={register("accountName")}
                hasError={errors.accountName}
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Account number"
                registration={register("accountNumber")}
                hasError={errors.accountNumber}
              />
            </div>
          </div>

          <Button type="submit" disabled={registerSchool.isPending} className="w-full">
            {registerSchool.isPending ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
};
