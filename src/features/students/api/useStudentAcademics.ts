import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { StudentAcademics, AxiosErrorResponse } from "../types";

interface UseStudentAcademicsParams {
  studentId: string;
  term: string;
  session: string;
}

export const useStudentAcademics = ({ studentId, term, session }: UseStudentAcademicsParams) => {
  return useQuery<StudentAcademics, AxiosErrorResponse>({
    queryKey: [...studentKeys.detail(studentId), "academics", term, session],
    queryFn: () => fetchData(`/students/${studentId}/academics?term=${term}&session=${encodeURIComponent(session)}`, "GET"),
    enabled: !!studentId && !!term && !!session,
  });
};
