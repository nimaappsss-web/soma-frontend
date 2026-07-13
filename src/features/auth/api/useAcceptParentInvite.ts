import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AcceptParentInviteRequest, LoginResponse, AxiosErrorResponse } from "../types";

export const useAcceptParentInvite = () => {
  return useMutation<LoginResponse, AxiosErrorResponse, AcceptParentInviteRequest>({
    mutationFn: (payload) => fetchData("/auth/accept-parent-invite", "POST", payload),
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
