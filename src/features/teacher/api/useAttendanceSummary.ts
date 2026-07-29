import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { AttendanceSummary, AxiosErrorResponse } from "../types";

export const useAttendanceSummary = (date: string) => {
  return useQuery<AttendanceSummary, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "summary", date],
    queryFn: () => fetchData(`/attendance/summary?date=${date}`, "GET"),
    enabled: !!date,
  });
};
