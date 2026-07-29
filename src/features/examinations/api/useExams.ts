import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { ExamListResponse, AxiosErrorResponse } from "../types";

interface UseExamsParams {
  term?: string;
  session?: string;
  subjectId?: string;
}

export const useExams = ({ term, session, subjectId }: UseExamsParams = {}) => {
  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (session) params.set("session", session);
  if (subjectId) params.set("subjectId", subjectId);

  return useQuery<ExamListResponse, AxiosErrorResponse>({
    queryKey: examKeys.list({ term: term ?? "", session: session ?? "", subjectId: subjectId ?? "" }),
    queryFn: () => fetchData(`/exams?${params.toString()}`, "GET"),
  });
};
