import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useResendInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (inviteId) => fetchData(`/teachers/${inviteId}/resend-invite`, "POST"),
    onSuccess: async () => {
      toast.success("Invitation resent!");
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
