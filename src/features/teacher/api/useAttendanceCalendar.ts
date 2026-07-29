import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceCalendar, AxiosErrorResponse } from "../types";

interface UseAttendanceCalendarParams {
  month: number;
  year: number;
  classId?: string;
}

export const useAttendanceCalendar = ({ month, year, classId }: UseAttendanceCalendarParams) => {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (classId) params.set("classId", classId);

  return useQuery<AttendanceCalendar, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "calendar", month, year, classId],
    queryFn: () => fetchData(`/attendance/calendar?${params.toString()}`, "GET"),
    enabled: !!month && !!year,
  });
};
