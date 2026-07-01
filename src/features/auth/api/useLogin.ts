import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { LoginRequest, LoginResponse, AxiosErrorResponse } from "../types";

export const useLogin = () => {
  return useMutation<LoginResponse, AxiosErrorResponse, LoginRequest>({
    mutationFn: (payload) => fetchData<LoginRequest>("/auth/login", "POST", payload),
    onSuccess: async () => {
      toast.success("Welcome back!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
