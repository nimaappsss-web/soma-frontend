import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useOnline } from "../../../hooks/useOnline";
import { attendanceKeys } from "../utils/query-keys";
import {
  dateSnapshotKey,
  summarySnapshotKey,
  monthSnapshotKey,
  readMostRecentDateSnapshot,
  readMostRecentSummarySnapshot,
  readMostRecentMonthSnapshot,
} from "../utils/snapshots";
import type {
  AttendanceAnalytics,
  AttendanceCalendarAnalytics,
  AttendanceSummary,
  AttendanceRange,
  AxiosErrorResponse,
} from "../types";

interface UseSchoolAttendanceResult<T> {
  data?: T;
  savedAt?: number;
  isLoading: boolean;
  isStale: boolean;
  isEmpty: boolean;
  error: AxiosErrorResponse | null;
  refetch: () => void;
}

export const useSchoolAttendanceToday = (date: string, classId?: string): UseSchoolAttendanceResult<AttendanceAnalytics> => {
  const online = useOnline();

  const params = new URLSearchParams({ date });
  if (classId) params.set("classId", classId);

  const query = useQuery<AttendanceAnalytics, AxiosErrorResponse>({
    queryKey: attendanceKeys.today(date, classId),
    queryFn: async () => {
      const res = await fetchData<AttendanceAnalytics>(`/analytics/attendance?${params.toString()}`, "GET");
      await db.attendanceSnapshots.put({ key: dateSnapshotKey(date, classId), data: res, savedAt: Date.now() });
      return res;
    },
    enabled: online && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () =>
      (date
        ? db.attendanceSnapshots.get(dateSnapshotKey(date, classId))
        : Promise.resolve(undefined)
      ).then((row) => row ?? undefined),
    [date, classId],
  );

  const mostRecent = useLiveQuery(() => readMostRecentDateSnapshot(), []);

  const snapshot = query.data ? undefined : (exactSnapshot ?? mostRecent);
  const data = (query.data ?? snapshot?.data) as AttendanceAnalytics | undefined;
  const savedAt = snapshot?.savedAt;
  const isEmpty = !data;
  const isStale = !query.data && !!data;

  const snapshotsReady = exactSnapshot !== undefined || mostRecent !== undefined;
  const isLoading = online ? query.isLoading && isEmpty : !snapshotsReady;

  return {
    data,
    savedAt,
    isLoading,
    isStale,
    isEmpty,
    error: query.error ?? null,
    refetch: () => query.refetch(),
  };
};

export const useSchoolAttendanceSummary = (
  date: string,
  classId?: string,
): UseSchoolAttendanceResult<AttendanceSummary> => {
  const online = useOnline();

  const params = new URLSearchParams({ date });
  if (classId) params.set("classId", classId);

  const query = useQuery<AttendanceSummary, AxiosErrorResponse>({
    queryKey: attendanceKeys.summary(date, classId),
    queryFn: async () => {
      const res = await fetchData<AttendanceSummary>(`/analytics/attendance/summary?${params.toString()}`, "GET");
      await db.attendanceSnapshots.put({ key: summarySnapshotKey(date, classId), data: res, savedAt: Date.now() });
      return res;
    },
    enabled: online && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () =>
      (date
        ? db.attendanceSnapshots.get(summarySnapshotKey(date, classId))
        : Promise.resolve(undefined)
      ).then((row) => row ?? undefined),
    [date, classId],
  );

  const mostRecent = useLiveQuery(() => readMostRecentSummarySnapshot(), []);

  const snapshot = query.data ? undefined : (exactSnapshot ?? mostRecent);
  const data = (query.data ?? snapshot?.data) as AttendanceSummary | undefined;
  const savedAt = snapshot?.savedAt;
  const isEmpty = !data;
  const isStale = !query.data && !!data;

  const snapshotsReady = exactSnapshot !== undefined || mostRecent !== undefined;
  const isLoading = online ? query.isLoading && isEmpty : !snapshotsReady;

  return {
    data,
    savedAt,
    isLoading,
    isStale,
    isEmpty,
    error: query.error ?? null,
    refetch: () => query.refetch(),
  };
};

export const useSchoolAttendanceRange = (
  from: string,
  to: string,
  classId?: string,
): UseSchoolAttendanceResult<AttendanceRange> => {
  const online = useOnline();

  const params = new URLSearchParams({ from, to });
  if (classId) params.set("classId", classId);

  const query = useQuery<AttendanceRange, AxiosErrorResponse>({
    queryKey: attendanceKeys.range(from, to, classId),
    queryFn: async () => {
      const res = await fetchData<AttendanceRange>(`/analytics/attendance/range?${params.toString()}`, "GET");
      await db.attendanceSnapshots.put({
        key: `range:${from}:${to}${classId ? `:${classId}` : ""}`,
        data: res,
        savedAt: Date.now(),
      });
      return res;
    },
    enabled: online && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () =>
      (from && to
        ? db.attendanceSnapshots.get(`range:${from}:${to}${classId ? `:${classId}` : ""}`)
        : Promise.resolve(undefined)
      ).then((row) => row ?? undefined),
    [from, to, classId],
  );

  const snapshot = query.data ? undefined : exactSnapshot;
  const data = (query.data ?? snapshot?.data) as AttendanceRange | undefined;
  const savedAt = snapshot?.savedAt;
  const isEmpty = !data;
  const isStale = !query.data && !!data;

  const snapshotsReady = exactSnapshot !== undefined;
  const isLoading = online ? query.isLoading && isEmpty : !snapshotsReady;

  return {
    data,
    savedAt,
    isLoading,
    isStale,
    isEmpty,
    error: query.error ?? null,
    refetch: () => query.refetch(),
  };
};

export const useSchoolAttendanceCalendar = (
  month: number,
  year: number,
  classId?: string,
): UseSchoolAttendanceResult<AttendanceCalendarAnalytics> => {
  const online = useOnline();

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (classId) params.set("classId", classId);

  const query = useQuery<AttendanceCalendarAnalytics, AxiosErrorResponse>({
    queryKey: attendanceKeys.calendar(month, year, classId),
    queryFn: async () => {
      const res = await fetchData<AttendanceCalendarAnalytics>(
        `/analytics/attendance/calendar?${params.toString()}`,
        "GET",
      );
      await db.attendanceSnapshots.put({
        key: monthSnapshotKey(month, year, classId),
        data: res,
        savedAt: Date.now(),
      });
      return res;
    },
    enabled: online && !!month && !!year,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () =>
      db.attendanceSnapshots
        .get(monthSnapshotKey(month, year, classId))
        .then((row) => row ?? undefined),
    [month, year, classId],
  );

  const mostRecent = useLiveQuery(() => readMostRecentMonthSnapshot(), []);

  const snapshot = query.data ? undefined : (exactSnapshot ?? mostRecent);
  const data = (query.data ?? snapshot?.data) as AttendanceCalendarAnalytics | undefined;
  const savedAt = snapshot?.savedAt;
  const isEmpty = !data;
  const isStale = !query.data && !!data;

  const snapshotsReady = exactSnapshot !== undefined || mostRecent !== undefined;
  const isLoading = online ? query.isLoading && isEmpty : !snapshotsReady;

  return {
    data,
    savedAt,
    isLoading,
    isStale,
    isEmpty,
    error: query.error ?? null,
    refetch: () => query.refetch(),
  };
};
