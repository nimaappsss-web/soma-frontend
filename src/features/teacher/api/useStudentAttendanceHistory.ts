import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceQueryResponse } from "../types";

interface UseStudentAttendanceHistoryParams {
  studentId: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const useStudentAttendanceHistory = ({
  studentId,
  from,
  to,
  page = 1,
  limit = 50,
}: UseStudentAttendanceHistoryParams) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return useQuery<AttendanceQueryResponse>({
    queryKey: [...attendanceKeys.detail(studentId), from, to, page, limit],
    queryFn: () =>
      fetchData(`/attendance/student/${studentId}?${params.toString()}`, "GET"),
    enabled: !!studentId,
  });
};
