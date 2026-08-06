import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface SetPasswordRequest {
  password: string;
}

interface SetPasswordResponse {
  message: string;
}

export const useSetPassword = () => {
  return useMutation<SetPasswordResponse, AxiosErrorResponse, SetPasswordRequest>({
    mutationFn: (payload) =>
      fetchData<SetPasswordRequest>("/auth/set-password", "POST", payload),
    onSuccess: async () => {
      toast.success("Password set successfully!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};