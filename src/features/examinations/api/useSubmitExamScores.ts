import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { SubmitScoresPayload, SubmitScoresResponse, AxiosErrorResponse } from "../types";

export const useSubmitExamScores = (examId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitScoresResponse, AxiosErrorResponse, SubmitScoresPayload>({
    mutationFn: (payload) => fetchData(`/exams/${examId}/scores`, "POST", payload),
    onSuccess: async (data) => {
      toast.success(`Scores saved: ${data.count} student(s)`);
      queryClient.invalidateQueries({ queryKey: examKeys.scores(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
