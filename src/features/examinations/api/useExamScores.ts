import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { ExamRosterResponse, AxiosErrorResponse } from "../types";

export const useExamScores = (examId: string) => {
  return useQuery<ExamRosterResponse, AxiosErrorResponse>({
    queryKey: examKeys.scores(examId),
    queryFn: () => fetchData(`/exams/${examId}/scores`, "GET"),
    enabled: !!examId,
  });
};
