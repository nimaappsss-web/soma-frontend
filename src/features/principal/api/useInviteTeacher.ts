import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { InviteTeacherRequest, InviteTeacherResponse, AxiosErrorResponse } from "../types";

export const useInviteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation<InviteTeacherResponse, AxiosErrorResponse, InviteTeacherRequest>({
    mutationFn: (payload) => fetchData<InviteTeacherRequest>("/auth/invite-teacher", "POST", payload),
    onSuccess: async () => {
      toast.success("Invitation sent to teacher!");
      queryClient.invalidateQueries({ queryKey: principalKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
