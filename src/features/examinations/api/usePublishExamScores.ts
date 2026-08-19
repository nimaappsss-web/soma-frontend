import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, PublishScoresResponse, ScoresBulkScope } from "../types";

export const usePublishExamScores = () => {
  const queryClient = useQueryClient();

  return useMutation<
    PublishScoresResponse,
    AxiosErrorResponse,
    ScoresBulkScope
  >({
    mutationFn: (scope) =>
      fetchData<PublishScoresResponse>("/exams/scores/publish", "POST", scope),
    onSuccess: async () => {
      toast.success("Broadcast to parents");
      queryClient.invalidateQueries({ queryKey: examKeys.scores });
      queryClient.invalidateQueries({ queryKey: examKeys.results });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
