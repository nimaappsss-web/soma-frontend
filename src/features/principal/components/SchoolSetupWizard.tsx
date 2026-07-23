import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { useRegisterSchool } from "../../auth/api";
import { useAuth } from "../../../contexts/AuthContext";
import { transformError } from "../../../utils/transformError";

const schoolSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  state: z.string().min(2, "State is required"),
  lga: z.string().min(2, "LGA is required"),
  address: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export const SchoolSetupWizard = () => {
  const registerSchool = useRegisterSchool();
  const { setTokens } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
  });

  const onSubmit = (data: SchoolFormData) => {
    registerSchool.mutate(
      {
        schoolName: data.schoolName,
        state: data.state,
        lga: data.lga,
        schoolType: [],
        address: data.address || undefined,
      },
      {
        onSuccess: (res) => {
          setTokens(res.accessToken, res.refreshToken, res.user);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
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

          <Button type="submit" disabled={registerSchool.isPending} className="w-full">
            {registerSchool.isPending ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
};
