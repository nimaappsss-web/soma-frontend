import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceTeacherSummary, AxiosErrorResponse } from "../types";

interface UseAttendanceTeacherSummaryParams {
  teacherId: string;
  from: string;
  to: string;
}

export const useAttendanceTeacherSummary = ({ teacherId, from, to }: UseAttendanceTeacherSummaryParams) => {
  return useQuery<AttendanceTeacherSummary, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "summary", "teacher", teacherId, from, to],
    queryFn: () => fetchData(`/attendance/summary/teacher/${teacherId}?from=${from}&to=${to}`, "GET"),
    enabled: !!teacherId && !!from && !!to,
  });
};
