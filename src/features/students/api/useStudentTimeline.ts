import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { StudentTimeline, AxiosErrorResponse } from "../types";

export const useStudentTimeline = (studentId: string) => {
  return useQuery<StudentTimeline, AxiosErrorResponse>({
    queryKey: [...studentKeys.detail(studentId), "timeline"],
    queryFn: () => fetchData(`/students/${studentId}/timeline`, "GET"),
    enabled: !!studentId,
  });
};
