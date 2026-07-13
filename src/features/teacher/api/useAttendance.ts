import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceQueryResponse } from "../types";

interface UseAttendanceParams {
  classId: string;
  date: string;
  page?: number;
  limit?: number;
}

export const useAttendance = ({ classId, date, page = 1, limit = 50 }: UseAttendanceParams) => {
  return useQuery<AttendanceQueryResponse>({
    queryKey: attendanceKeys.list(classId, date),
    queryFn: () =>
      fetchData(`/attendance?classId=${classId}&date=${date}&page=${page}&limit=${limit}`, "GET"),
    enabled: !!classId && !!date,
  });
};
