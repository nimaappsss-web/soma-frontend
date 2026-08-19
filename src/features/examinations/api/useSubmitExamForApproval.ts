import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, SubmitForApprovalResponse, ScoresBulkScope } from "../types";

export interface SubmitForApprovalPayload extends ScoresBulkScope {
  note?: string;
}

export const useSubmitExamForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SubmitForApprovalResponse,
    AxiosErrorResponse,
    SubmitForApprovalPayload
  >({
    mutationFn: (payload) =>
      fetchData<SubmitForApprovalResponse>("/exams/scores/submit-for-approval", "POST", payload),
    onSuccess: async () => {
      toast.success("Submitted for principal approval");
      queryClient.invalidateQueries({ queryKey: examKeys.scores });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};