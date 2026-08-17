import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { LoginResponse, AxiosErrorResponse } from "../types";

interface VerifyPhoneOTPRequest {
  phone: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
}

export const useVerifyPhoneOTP = () => {
  return useMutation<LoginResponse, AxiosErrorResponse, VerifyPhoneOTPRequest>({
    mutationFn: (payload) => fetchData("/auth/verify-otp", "POST", payload),
    onSuccess: async () => {
      toast.success("Welcome back!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
