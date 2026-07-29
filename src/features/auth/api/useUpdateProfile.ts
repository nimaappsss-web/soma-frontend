import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { authKeys } from "../utils/query-keys";
import type { User, AxiosErrorResponse } from "../types";

interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  image?: string;
}

interface UpdateProfileResponse {
  user: User;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, AxiosErrorResponse, UpdateProfileRequest>({
    mutationFn: (payload) => fetchData("/auth/me", "PATCH", payload),
    onSuccess: async () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: authKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
