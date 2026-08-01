import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { SaveStudentScorePayload, SaveStudentScoreResponse, AxiosErrorResponse } from "../types";

export const useSaveExamStudentScore = (examId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SaveStudentScoreResponse, AxiosErrorResponse, { studentId: string; data: SaveStudentScorePayload }>({
    mutationFn: ({ studentId, data }) => fetchData(`/exams/${examId}/student/${studentId}`, "PUT", data),
    onSuccess: async (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: examKeys.scores(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.studentScore(examId, studentId) });
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
