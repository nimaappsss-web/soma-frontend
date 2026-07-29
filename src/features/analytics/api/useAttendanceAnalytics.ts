import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { analyticsKeys } from "../utils/query-keys";
import type { AttendanceAnalytics, AxiosErrorResponse } from "../types";

export const useAttendanceAnalytics = (date: string) => {
  return useQuery<AttendanceAnalytics, AxiosErrorResponse>({
    queryKey: analyticsKeys.attendance(date),
    queryFn: () => fetchData(`/analytics/attendance?date=${date}`, "GET"),
    enabled: !!date,
  });
};
