import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { BulkInviteRequest, BulkInviteResponse, AxiosErrorResponse } from "../types";

export const useBulkInvite = () => {
  return useMutation<BulkInviteResponse, AxiosErrorResponse, BulkInviteRequest>({
    mutationFn: (payload) => fetchData<BulkInviteRequest>("/auth/bulk-invite", "POST", payload),
    onSuccess: async (data) => {
      toast.success(`${data.invited} invitation(s) sent!`);
      if (data.failed?.length > 0) {
        data.failed.forEach((f) => toast.error(`Failed: ${f.phone} - ${f.reason}`));
      }
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
