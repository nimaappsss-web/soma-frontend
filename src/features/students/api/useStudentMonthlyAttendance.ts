import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { StudentMonthlyAttendance, AxiosErrorResponse } from "../types";

interface UseStudentMonthlyAttendanceParams {
  studentId: string;
  month: number;
  year: number;
}

export const useStudentMonthlyAttendance = ({ studentId, month, year }: UseStudentMonthlyAttendanceParams) => {
  return useQuery<StudentMonthlyAttendance, AxiosErrorResponse>({
    queryKey: [...studentKeys.detail(studentId), "attendance", "monthly", month, year],
    queryFn: () => fetchData(`/students/${studentId}/attendance/monthly?month=${month}&year=${year}`, "GET"),
    enabled: !!studentId && !!month && !!year,
  });
};
