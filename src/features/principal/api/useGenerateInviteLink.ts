import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../../teacher/utils/query-keys";
import type { GenerateInviteLinkResponse, AxiosErrorResponse } from "../types";

export const useGenerateInviteLink = () => {
  const queryClient = useQueryClient();

  return useMutation<GenerateInviteLinkResponse, AxiosErrorResponse, { role: string }>({
    mutationFn: (payload) => fetchData<GenerateInviteLinkResponse>("/auth/generate-invite-link", "POST", payload as any),
    onSuccess: async () => {
      toast.success("Invite link generated!");
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
