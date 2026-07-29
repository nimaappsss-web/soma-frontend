import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { InviteStaffPayload, AxiosErrorResponse } from "../types";

export const useInviteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<{ staff: { id: string; status: string } }, AxiosErrorResponse, InviteStaffPayload>({
    mutationFn: (payload) => fetchData("/staff/invite", "POST", payload),
    onSuccess: async () => {
      toast.success("Staff invitation sent!");
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
