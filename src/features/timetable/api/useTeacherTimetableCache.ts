import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { db, type TimetableEntryCache } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { timetableKeys } from "../utils/query-keys";
import { dayOrder, type TimetableEntry, type TimetableListResponse } from "../types";

const toCache = (userId: string, e: TimetableEntry): TimetableEntryCache => ({
  id: e.id,
  userId,
  timetableId: e.timetableId ?? "",
  classId: e.classId,
  className: e.className,
  subjectId: e.subjectId,
  subjectName: e.subjectName,
  teacherId: e.teacherId,
  teacherName: e.teacherName,
  day: e.day,
  period: e.period,
  startTime: e.startTime,
  endTime: e.endTime,
  room: e.room ?? null,
  updatedAt: Date.now(),
});

const fromCache = (c: TimetableEntryCache): TimetableEntry => ({
  id: c.id,
  classId: c.classId,
  className: c.className ?? "",
  subjectId: c.subjectId,
  subjectName: c.subjectName ?? "",
  teacherId: c.teacherId,
  teacherName: c.teacherName ?? "",
  day: c.day as TimetableEntry["day"],
  period: c.period,
  startTime: c.startTime,
  endTime: c.endTime,
  room: c.room ?? null,
  timetableId: c.timetableId || null,
});

export interface UseTeacherTimetableReturn {
  entries: TimetableEntry[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** Offline-first read of a single teacher's schedule across all classes. */
export const useTeacherTimetableCache = (teacherId: string): UseTeacherTimetableReturn => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId || !teacherId) return;
    const sub = liveQuery(() =>
      db.timetableEntries
        .where("userId")
        .equals(userId)
        .filter((e) => e.teacherId === teacherId)
        .toArray(),
    ).subscribe({
      next: (rows) => {
        setEntries(
          rows
            .map(fromCache)
            .sort(
              (a, b) =>
                (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99) || a.period - b.period,
            ),
        );
        setIsReady(true);
      },
    });
    return () => sub.unsubscribe();
  }, [userId, teacherId]);

  const query = useQuery<TimetableListResponse, unknown>({
    queryKey: timetableKeys.teacher(teacherId),
    queryFn: async () => {
      const res = await fetchData<TimetableListResponse>(
        `/timetable/teacher/${teacherId}`,
        "GET",
      );
      // Merge-only write: the response covers a single teacher and must never
      // clobber the rest of the school cache.
      if (res.entries?.length) {
        await db.timetableEntries.bulkPut(res.entries.map((e: TimetableEntry) => toCache(userId, e)));
      }
      return res;
    },
    enabled: !!userId && !!teacherId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    entries,
    isLoading: !isReady || query.isLoading,
    error: query.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: timetableKeys.teacher(teacherId) }),
  };
};