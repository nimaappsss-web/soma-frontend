import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { useActiveTerm } from "../../calendar/api";
import { examKeys } from "../utils/query-keys";
import { seedStudentReport, studentReportCacheId } from "../utils/studentReportCache";
import type { StudentAcademicsResponse, AxiosErrorResponse } from "../types";

/**
 * Offline-first read of a single student's CA & exam report for a term. Instant
 * read from the cached document (db.examStudentReports) via Dexie liveQuery,
 * with a background fetch of /students/:id/academics that refreshes the cache.
 */
export const useStudentReport = (studentId: string, term?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  const cacheKey = userId && studentId && resolvedTerm
    ? studentReportCacheId(userId, studentId, resolvedTerm)
    : "";

  const cached = useLiveQuery(
    async () => {
      if (!cacheKey) return undefined as StudentAcademicsResponse | undefined;
      const row = await db.examStudentReports.get(cacheKey);
      return row ? (JSON.parse(row.reportJson) as StudentAcademicsResponse) : undefined;
    },
    [cacheKey],
  );

  const query = useQuery<StudentAcademicsResponse, AxiosErrorResponse>({
    queryKey: examKeys.studentReport(studentId, resolvedTerm ?? ""),
    queryFn: async () => {
      const res = await fetchData<StudentAcademicsResponse>(
        `/students/${studentId}/academics?term=${resolvedTerm}&session=`,
        "GET",
      );
      await seedStudentReport(userId, studentId, resolvedTerm ?? "", res.session ?? "", res);
      return res;
    },
    enabled: !!userId && !!studentId && !!resolvedTerm,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: cached !== undefined ? cached : query.data,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
