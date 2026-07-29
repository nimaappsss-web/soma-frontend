import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceClassSummary, AxiosErrorResponse } from "../types";

interface UseAttendanceClassSummaryParams {
  classId: string;
  from: string;
  to: string;
}

export const useAttendanceClassSummary = ({ classId, from, to }: UseAttendanceClassSummaryParams) => {
  return useQuery<AttendanceClassSummary, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "summary", "class", classId, from, to],
    queryFn: () => fetchData(`/attendance/summary/class/${classId}?from=${from}&to=${to}`, "GET"),
    enabled: !!classId && !!from && !!to,
  });
};
