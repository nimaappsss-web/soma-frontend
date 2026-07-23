import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { VerifyRegistrationOTPRequest, VerifyRegistrationOTPResponse, AxiosErrorResponse } from "../types";

export const useVerifyRegistrationOTP = () => {
  return useMutation<VerifyRegistrationOTPResponse, AxiosErrorResponse, VerifyRegistrationOTPRequest>({
    mutationFn: (payload) => fetchData("/auth/verify-registration-otp", "POST", payload),
    onSuccess: async () => {
      toast.success("Email verified!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
