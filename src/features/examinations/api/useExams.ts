import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { examKeys } from "../utils/query-keys";
import type { ExamListResponse, AxiosErrorResponse } from "../types";

interface UseExamsParams {
  term?: string;
  session?: string;
  subjectId?: string;
}

export const useExams = ({ term, session, subjectId }: UseExamsParams = {}) => {
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  const params = new URLSearchParams();
  if (resolvedTerm) params.set("term", resolvedTerm);
  if (session) params.set("session", session);
  if (subjectId) params.set("subjectId", subjectId);

  return useQuery<ExamListResponse, AxiosErrorResponse>({
    queryKey: examKeys.list({ term: resolvedTerm ?? "", session: session ?? "", subjectId: subjectId ?? "" }),
    queryFn: () => fetchData(`/exams?${params.toString()}`, "GET"),
    enabled: !!resolvedTerm,
  });
};
