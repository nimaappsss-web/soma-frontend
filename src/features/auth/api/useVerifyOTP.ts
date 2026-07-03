import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { VerifyOTPResponse, AxiosErrorResponse } from "../types";

export const useSendOTP = () => {
  return useMutation({
    mutationFn: (phone: string) => fetchData("/auth/send-otp", "POST", { phone }),
    onSuccess: async () => {
      toast.success("OTP sent to phone!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};

export const useSendOTPByEmail = () => {
  return useMutation({
    mutationFn: (email: string) => fetchData("/auth/send-otp", "POST", { email }),
    onSuccess: async () => {
      toast.success("OTP sent to email!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};

export const useVerifyOTP = () => {
  return useMutation<VerifyOTPResponse, AxiosErrorResponse, { email: string; code: string }>({
    mutationFn: (payload) =>
      fetchData("/auth/verify-email-otp", "POST", {
        email: payload.email,
        code: payload.code,
      }),
    onSuccess: async () => {
      toast.success("Email verified!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
