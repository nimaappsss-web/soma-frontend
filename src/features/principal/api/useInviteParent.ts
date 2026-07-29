import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { parentKeys } from "../utils/query-keys";
import type { InviteParentRequest, InviteParentResponse, AxiosErrorResponse } from "../types";

export const useInviteParent = () => {
  const queryClient = useQueryClient();

  return useMutation<InviteParentResponse, AxiosErrorResponse, InviteParentRequest>({
    mutationFn: (payload) => fetchData("/parents/invite", "POST", payload),
    onSuccess: async () => {
      toast.success("Parent invited!");
      queryClient.invalidateQueries({ queryKey: parentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
