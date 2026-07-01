import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { RegisterPrincipalRequest, RegisterPrincipalResponse, AxiosErrorResponse } from "../types";

export const useRegisterPrincipal = () => {
  return useMutation<RegisterPrincipalResponse, AxiosErrorResponse, RegisterPrincipalRequest>({
    mutationFn: (payload) => fetchData<RegisterPrincipalRequest>("/auth/register-principal", "POST", payload),
    onSuccess: async () => {
      toast.success("Account created! Check your phone for the OTP.");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
