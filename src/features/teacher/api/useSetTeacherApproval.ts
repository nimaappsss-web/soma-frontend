import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { teachers } from "../../../lib/queryKeys";
import type { AxiosErrorResponse } from "../types";

interface ApprovalResponse {
  message: string;
}

interface SetTeacherApprovalPayload {
  id: string;
  status: "APPROVED" | "REJECTED";
}

export const useSetTeacherApproval = () => {
  const queryClient = useQueryClient();

  return useMutation<ApprovalResponse, AxiosErrorResponse, SetTeacherApprovalPayload>({
    mutationFn: ({ id, status }) =>
      fetchData(`/teachers/${id}/approval`, "PATCH", { status }),
    onSuccess: async () => {
      toast.success("Teacher status updated!");
      queryClient.invalidateQueries({ queryKey: teachers.all });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};