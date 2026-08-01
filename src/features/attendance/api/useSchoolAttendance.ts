import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useOnline } from "../../../hooks/useOnline";
import { attendanceKeys } from "../utils/query-keys";
import {
  dateSnapshotKey,
  monthSnapshotKey,
  readMostRecentDateSnapshot,
  readMostRecentMonthSnapshot,
} from "../utils/snapshots";
import type { AttendanceAnalytics, AttendanceCalendarAnalytics, AxiosErrorResponse } from "../types";

interface UseSchoolAttendanceTodayResult {
  data?: AttendanceAnalytics;
  savedAt?: number;
  isLoading: boolean;
  isStale: boolean;
  isEmpty: boolean;
  error: AxiosErrorResponse | null;
  refetch: () => void;
}

export const useSchoolAttendanceToday = (date: string): UseSchoolAttendanceTodayResult => {
  const online = useOnline();

  const query = useQuery<AttendanceAnalytics, AxiosErrorResponse>({
    queryKey: attendanceKeys.today(date),
    queryFn: async () => {
      const res = await fetchData<AttendanceAnalytics>(`/analytics/attendance?date=${date}`, "GET");
      await db.attendanceSnapshots.put({ key: dateSnapshotKey(date), data: res, savedAt: Date.now() });
      return res;
    },
    enabled: online && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () =>
      (date
        ? db.attendanceSnapshots.get(dateSnapshotKey(date))
        : Promise.resolve(undefined)
      ).then((row) => row ?? undefined),
    [date],
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

interface UseSchoolAttendanceCalendarResult {
  data?: AttendanceCalendarAnalytics;
  savedAt?: number;
  isLoading: boolean;
  isStale: boolean;
  isEmpty: boolean;
  error: AxiosErrorResponse | null;
  refetch: () => void;
}

export const useSchoolAttendanceCalendar = (
  month: number,
  year: number,
): UseSchoolAttendanceCalendarResult => {
  const online = useOnline();

  const query = useQuery<AttendanceCalendarAnalytics, AxiosErrorResponse>({
    queryKey: attendanceKeys.calendar(month, year),
    queryFn: async () => {
      const res = await fetchData<AttendanceCalendarAnalytics>(
        `/analytics/attendance/calendar?month=${month}&year=${year}`,
        "GET",
      );
      await db.attendanceSnapshots.put({
        key: monthSnapshotKey(month, year),
        data: res,
        savedAt: Date.now(),
      });
      return res;
    },
    enabled: online && !!month && !!year,
    staleTime: 5 * 60 * 1000,
  });

  const exactSnapshot = useLiveQuery(
    () => db.attendanceSnapshots.get(monthSnapshotKey(month, year)).then((row) => row ?? undefined),
    [month, year],
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
