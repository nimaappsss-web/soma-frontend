import { useMutation } from "@tanstack/react-query";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  message: string;
}

export const useResetPassword = () => {
  return useMutation<ResetPasswordResponse, AxiosErrorResponse, ResetPasswordRequest>({
    mutationFn: (payload) => fetchData<ResetPasswordRequest>("/auth/reset-password", "POST", payload),
    onError: async (error) => {
      throw new Error(transformError(error));
    },
  });
};
