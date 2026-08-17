import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useResendStaffInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (staffId) => fetchData(`/staff/${staffId}/resend-invite`, "POST"),
    onSuccess: async () => {
      toast.success("Invitation resent!");
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};