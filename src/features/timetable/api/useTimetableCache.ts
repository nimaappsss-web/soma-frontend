import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { db, type TimetableCache, type TimetableEntryCache } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { timetableKeys } from "../utils/query-keys";
import { dayOrder, type TimetableBreak, type TimetableEntry, type TimetableListResponse } from "../types";

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

export interface UseTimetableCacheReturn {
  entries: TimetableEntry[];
  breaks: TimetableBreak[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** Offline-first timetable read: Dexie liveQuery cache, refreshed from the server. */
export const useTimetableCache = (classId?: string): UseTimetableCacheReturn => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [breaks, setBreaks] = useState<TimetableBreak[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const sub = liveQuery(() => {
      const rows = db.timetableEntries.where("userId").equals(userId);
      const ttRows = classId
        ? db.timetables.where("userId").equals(userId).filter((t) => t.classId === classId)
        : undefined;
      const entriesQ = classId ? rows.filter((e) => e.classId === classId) : rows;
      return Promise.all([entriesQ.toArray(), ttRows?.toArray() ?? Promise.resolve([])]);
    }).subscribe({
      next: ([rows, headers]) => {
        const sorted = rows
          .map(fromCache)
          .sort(
            (a, b) =>
              (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99) || a.period - b.period,
          );
        setEntries(sorted);
        if (headers && headers.length > 0) {
          const t = headers[0] as TimetableCache;
          try {
            setBreaks(JSON.parse(t.breaksJson || "[]"));
          } catch {
            setBreaks([]);
          }
        }
        setIsReady(true);
      },
    });
    return () => sub.unsubscribe();
  }, [userId, classId]);

  const query = useQuery<TimetableListResponse, unknown>({
    queryKey: timetableKeys.list(classId ?? "", undefined),
    queryFn: async () => {
      const url = classId
        ? `/timetable?classId=${encodeURIComponent(classId)}`
        : "/timetable";
      const res = await fetchData<TimetableListResponse>(url, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) =>
            i.table === "timetableEntries" &&
            i.recordId === (classId ?? "") &&
            i.status === "pending",
        )
        .count();

      await db.transaction("rw", db.timetableEntries, db.timetables, async () => {
        if (hasPending === 0) {
          if (classId) {
            await db.timetableEntries
              .where("userId")
              .equals(userId)
              .filter((e) => e.classId === classId)
              .delete();
            await db.timetables
              .where("userId")
              .equals(userId)
              .filter((t) => t.classId === classId)
              .delete();
          } else {
            await db.timetableEntries.where("userId").equals(userId).delete();
          }
        }

        if (res.entries?.length) {
          await db.timetableEntries.bulkPut(res.entries.map((e: TimetableEntry) => toCache(userId, e)));
        }
        if (classId && res.entries?.length) {
          await db.timetables.put({
            id: classId,
            userId,
            classId,
            className: res.entries[0]?.className ?? "",
            title: "",
            breaksJson: JSON.stringify(res.breaks ?? []),
            updatedAt: Date.now(),
          });
        } else if (!classId && res.breaksByClass && Object.keys(res.breaksByClass).length > 0) {
          const existing = await db.timetables.where("userId").equals(userId).toArray();
          const byClass = new Map(existing.map((t) => [t.classId, t]));
          await db.timetables.bulkPut(
            Object.entries(res.breaksByClass).map(([cid, brk]) => {
              const prev = byClass.get(cid);
              return {
                id: cid,
                userId,
                classId: cid,
                className: prev?.className ?? "",
                title: prev?.title ?? "",
                breaksJson: JSON.stringify(brk ?? []),
                updatedAt: Date.now(),
              };
            }),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: classId ? 0 : 5 * 60 * 1000,
    retry: 1,
  });

  const isEmpty = !isReady;

  return {
    entries,
    breaks,
    isLoading: isEmpty,
    error: query.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: timetableKeys.lists() }),
  };
};