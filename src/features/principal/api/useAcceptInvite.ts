import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AcceptInviteRequest, AcceptInviteResponse, AxiosErrorResponse } from "../types";

export const useAcceptInvite = () => {
  return useMutation<AcceptInviteResponse, AxiosErrorResponse, AcceptInviteRequest>({
    mutationFn: (payload) => fetchData<AcceptInviteRequest>("/auth/accept-invite", "POST", payload),
    onSuccess: async () => {
      toast.success("Account set up! You can now log in.");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
