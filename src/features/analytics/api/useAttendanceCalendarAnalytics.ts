import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { analyticsKeys } from "../utils/query-keys";
import type { AttendanceCalendarAnalytics, AxiosErrorResponse } from "../types";

interface UseAttendanceCalendarAnalyticsParams {
  month: number;
  year: number;
  classId?: string;
}

export const useAttendanceCalendarAnalytics = ({ month, year, classId }: UseAttendanceCalendarAnalyticsParams) => {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (classId) params.set("classId", classId);

  return useQuery<AttendanceCalendarAnalytics, AxiosErrorResponse>({
    queryKey: analyticsKeys.calendar(month, year, classId),
    queryFn: () => fetchData(`/analytics/attendance/calendar?${params.toString()}`, "GET"),
    enabled: !!month && !!year,
  });
};
