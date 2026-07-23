import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { GoogleAuthRequest, GoogleAuthResponse, AxiosErrorResponse } from "../types";

export const useGoogleAuth = () => {
  return useMutation<GoogleAuthResponse, AxiosErrorResponse, GoogleAuthRequest>({
    mutationFn: (payload) =>
      fetchData("/auth/google", "POST", payload),
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
