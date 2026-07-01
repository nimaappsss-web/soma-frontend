import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { VerifyOTPRequest, VerifyOTPResponse, AxiosErrorResponse } from "../types";

export const useSendOTP = () => {
  return useMutation({
    mutationFn: (phone: string) => fetchData<{ phone: string }>("/auth/send-otp", "POST", { phone }),
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};

export const useVerifyOTP = () => {
  return useMutation<VerifyOTPResponse, AxiosErrorResponse, VerifyOTPRequest>({
    mutationFn: (payload) =>
      fetchData<VerifyOTPRequest>("/auth/verify-otp", "POST", {
        ...payload,
        deviceId: payload.deviceId ?? "web",
        deviceName: payload.deviceName ?? "Web Browser",
      }),
    onSuccess: async () => {
      toast.success("Phone verified!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
