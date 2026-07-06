import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { CompleteRegistrationRequest, CompleteRegistrationResponse, AxiosErrorResponse } from "../types";

export const useCompleteRegistration = () => {
  return useMutation<CompleteRegistrationResponse, AxiosErrorResponse, CompleteRegistrationRequest>({
    mutationFn: (payload) => fetchData<CompleteRegistrationRequest>("/auth/complete-registration", "POST", payload),
    onSuccess: async () => {
      toast.success("Registration complete!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
