import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { LoginResponse, AxiosErrorResponse } from "../types";

interface VerifyLoginOTPRequest {
  identifier: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
}

export const useVerifyLoginOTP = () => {
  return useMutation<LoginResponse, AxiosErrorResponse, VerifyLoginOTPRequest>({
    mutationFn: (payload) => fetchData("/auth/verify-login-otp", "POST", payload),
    onSuccess: async () => {
      toast.success("Welcome back!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
