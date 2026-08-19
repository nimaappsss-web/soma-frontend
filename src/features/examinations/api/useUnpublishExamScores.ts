import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, ScoresBulkScope } from "../types";

export const useUnpublishExamScores = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; examId: string; visibleToParents: boolean },
    AxiosErrorResponse,
    ScoresBulkScope
  >({
    mutationFn: (scope) =>
      fetchData("/exams/scores/unpublish", "POST", scope),
    onSuccess: async () => {
      toast.success("Hidden from parents");
      queryClient.invalidateQueries({ queryKey: examKeys.scores });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};