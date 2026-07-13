import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { parentKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useResendParentInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (inviteId) =>
      fetchData(`/students/resend-parent-invite/${inviteId}`, "POST"),
    onSuccess: () => {
      toast.success("Invite resent");
      queryClient.invalidateQueries({ queryKey: parentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parentKeys.details() });
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
