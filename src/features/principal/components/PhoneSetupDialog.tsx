import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Button } from "../../../components/ui/button";
import { PhoneInputField } from "../../../components/ui/phone-input";
import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import type { User, AxiosErrorResponse } from "../../auth/types";

const phoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export const PhoneSetupDialog = () => {
  const { setTokens, user } = useAuth();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const phoneValue = watch("phone");

  const updatePhoneMutation = useMutation<
    { user: User },
    AxiosErrorResponse,
    { phone: string }
  >({
    mutationFn: (payload) => fetchData("/auth/me", "PATCH", payload),
    onSuccess: (res) => {
      toast.success("Phone number saved!");
      if (user) {
        setTokens(
          localStorage.getItem("soma_access_token") || "",
          localStorage.getItem("soma_refresh_token") || "",
          { ...user, ...res.user, needsPhoneSetup: false },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });

  const onSubmit = (data: PhoneFormData) => {
    updatePhoneMutation.mutate({ phone: data.phone });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Add Phone Number</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please enter your phone number to continue.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <PhoneInputField
              placeholder="Phone number"
              value={phoneValue}
              onChange={(val) => setValue("phone", val)}
              defaultCountry="NG"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-2">{errors.phone.message}</p>
            )}
          </div>

          <Button type="submit" disabled={updatePhoneMutation.isPending} className="w-full">
            {updatePhoneMutation.isPending ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
};
