import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { studentKeys } from "../utils/query-keys";
import type { StudentAcademics, AxiosErrorResponse } from "../types";

interface UseStudentAcademicsParams {
  studentId: string;
  term?: string;
  session?: string;
}

export const useStudentAcademics = ({ studentId, term, session }: UseStudentAcademicsParams) => {
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  return useQuery<StudentAcademics, AxiosErrorResponse>({
    queryKey: [...studentKeys.detail(studentId), "academics", resolvedTerm, session],
    queryFn: () => fetchData(`/students/${studentId}/academics?term=${resolvedTerm}&session=${session ? encodeURIComponent(session) : ""}`, "GET"),
    enabled: !!studentId && !!resolvedTerm,
  });
};
