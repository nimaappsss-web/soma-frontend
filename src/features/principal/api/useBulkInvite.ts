import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { BulkInviteRequest, BulkInviteResponse, AxiosErrorResponse } from "../types";

export const useBulkInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkInviteResponse, AxiosErrorResponse, BulkInviteRequest>({
    mutationFn: (payload) => fetchData<BulkInviteRequest>("/auth/bulk-invite", "POST", payload),
    onSuccess: async (data) => {
      toast.success(`${data.invited} invitation(s) sent!`);
      if (data.failed?.length > 0) {
        data.failed.forEach((f) => toast.error(`Failed: ${f.phone} - ${f.reason}`));
      }
      queryClient.invalidateQueries({ queryKey: principalKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
