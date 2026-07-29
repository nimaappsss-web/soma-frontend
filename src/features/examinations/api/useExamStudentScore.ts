import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { ExamStudentScoreResponse, AxiosErrorResponse } from "../types";

export const useExamStudentScore = (examId: string, studentId: string) => {
  return useQuery<ExamStudentScoreResponse, AxiosErrorResponse>({
    queryKey: examKeys.studentScore(examId, studentId),
    queryFn: () => fetchData(`/exams/${examId}/student/${studentId}`, "GET"),
    enabled: !!examId && !!studentId,
  });
};
