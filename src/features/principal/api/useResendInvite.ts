import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosErrorResponse } from "../types";

export const useResendInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (inviteId) => fetchData(`/teachers/${inviteId}/resend-invite`, "POST"),
    onSuccess: async () => {
      toast.success("Invitation resent!");
      queryClient.invalidateQueries({ queryKey: principalKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
