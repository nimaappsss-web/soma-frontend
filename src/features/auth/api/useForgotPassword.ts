import { useMutation } from "@tanstack/react-query";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, AxiosErrorResponse, ForgotPasswordRequest>({
    mutationFn: (payload) => fetchData<ForgotPasswordRequest>("/auth/forgot-password", "POST", payload),
    onError: async (error) => {
      throw new Error(transformError(error));
    },
  });
};
