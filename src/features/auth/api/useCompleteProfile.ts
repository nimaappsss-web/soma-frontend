import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { CompleteProfileRequest, CompleteProfileResponse, AxiosErrorResponse } from "../types";

export const useCompleteProfile = () => {
  return useMutation<CompleteProfileResponse, AxiosErrorResponse, CompleteProfileRequest>({
    mutationFn: (payload) => fetchData("/auth/complete-profile", "POST", payload),
    onSuccess: async () => {
      toast.success("Profile created!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
