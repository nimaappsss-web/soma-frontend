import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { StartRegistrationRequest, StartRegistrationResponse, AxiosErrorResponse } from "../types";

export const useStartRegistration = () => {
  return useMutation<StartRegistrationResponse, AxiosErrorResponse, StartRegistrationRequest>({
    mutationFn: (payload) => fetchData("/auth/start-registration", "POST", payload),
    onSuccess: async () => {
      toast.success("Verification code sent to your email!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
