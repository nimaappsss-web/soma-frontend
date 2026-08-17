import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type AttendanceRecord } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import { useTeacherProfile } from "./useTeacherProfile";
import type { AttendanceClassSummary, AxiosErrorResponse } from "../types";

interface UseAttendanceClassSummaryParams {
  classId: string;
  from: string;
  to: string;
}

export const useAttendanceClassSummary = ({ classId, from, to }: UseAttendanceClassSummaryParams) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { formClass } = useTeacherProfile();
  const className = formClass ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId || !className || !from || !to) return Promise.resolve([] as AttendanceRecord[]);
      return db.attendance
        .where("[userId+date+className]")
        .between([userId, from, className], [userId, to, className])
        .toArray();
    },
    [userId, className, from, to],
  );

  const query = useQuery<AttendanceClassSummary, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "summary", "class", classId, from, to],
    queryFn: () => fetchData(`/attendance/summary/my-class/${classId}?from=${from}&to=${to}`, "GET"),
    enabled: !!classId && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

  const cachedSummary = useMemo<AttendanceClassSummary | undefined>(() => {
    if (!cached || cached.length === 0) return undefined;
    const present = cached.filter((r) => r.status === "present").length;
    const absent = cached.filter((r) => r.status === "absent").length;
    const late = cached.filter((r) => r.status === "late").length;
    const marked = present + absent + late;
    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0;
    return {
      classId,
      className,
      from,
      to,
      totalStudents: marked,
      present,
      absent,
      percentage,
      schoolDays: 1,
      dailyStats: {},
    };
  }, [cached, classId, className, from, to]);

  return {
    data: cached !== undefined && cached.length > 0 ? (cachedSummary ?? query.data) : (query.data ?? undefined),
    isLoading: cached === undefined || (cached.length === 0 && query.isLoading),
    error: query.error ?? undefined,
  };
};