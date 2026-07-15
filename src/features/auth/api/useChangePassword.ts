import { useMutation } from "@tanstack/react-query";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, AxiosErrorResponse, ChangePasswordRequest>({
    mutationFn: (payload) =>
      fetchData<ChangePasswordRequest>("/auth/change-password", "POST", payload),
    onError: async (error) => {
      throw new Error(transformError(error));
    },
  });
};
