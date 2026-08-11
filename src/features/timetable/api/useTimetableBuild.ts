import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { db, type TimetableBuildCache } from "../../../db/db";
import { timetableKeys } from "../utils/query-keys";
import { busyTeachersFromEntries, mergeBusyTeachers } from "../utils/busyTeachers";
import type { BusyTeacher, TimetableBuildData, AxiosErrorResponse } from "../types";

const parse = (c: TimetableBuildCache | undefined): TimetableBuildData | undefined => {
  if (!c) return undefined;
  try {
    return JSON.parse(c.dataJson) as TimetableBuildData;
  } catch {
    return undefined;
  }
};

/**
 * Cache-first read for the timetable builder. Returns the cached build payload
 * (subjects, busy-teachers, existing entries/breaks) from Dexie instantly, and
 * refreshes it from the server in the background whenever online.
 */
export const useTimetableBuild = (classId: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [cached, setCached] = useState<TimetableBuildData | undefined>(undefined);

  useEffect(() => {
    if (!userId || !classId) return;
    const sub = liveQuery(() => db.timetableBuilds.where("userId").equals(userId).toArray()).subscribe({
      next: (rows) => setCached(parse(rows.find((r) => r.id === classId))),
    });
    return () => sub.unsubscribe();
  }, [userId, classId]);

  // Offline-first cross-class clash avoidance: every published/queued timetable
  // entry in Dexie (from OTHER classes) contributes teacher busy windows, so the
  // generator avoids them even when the server build payload is stale or offline.
  const [localBusy, setLocalBusy] = useState<BusyTeacher[]>([]);
  useEffect(() => {
    if (!userId || !classId) return;
    const sub = liveQuery(() =>
      db.timetableEntries
        .where("userId")
        .equals(userId)
        .filter((e) => e.classId !== classId)
        .toArray(),
    ).subscribe({
      next: (rows) => setLocalBusy(busyTeachersFromEntries(rows)),
    });
    return () => sub.unsubscribe();
  }, [userId, classId]);

  const query = useQuery<TimetableBuildData, AxiosErrorResponse>({
    queryKey: timetableKeys.build(classId),
    queryFn: async () => {
      const res = await fetchData<TimetableBuildData>(`/timetable/build/${classId}`, "GET");
      if (userId) {
        await db.timetableBuilds.put({
          id: classId,
          userId,
          classId,
          dataJson: JSON.stringify(res),
          updatedAt: Date.now(),
        });
      }
      return res;
    },
    enabled: !!classId && !!userId,
    staleTime: 30_000,
    retry: 1,
  });

  const raw = cached !== undefined ? cached : query.data;
  const busyTeachers = useMemo(
    () => mergeBusyTeachers(raw?.busyTeachers ?? [], localBusy),
    [raw, localBusy],
  );

  return {
    data: raw ? { ...raw, busyTeachers } : undefined,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
    hasCache: cached !== undefined,
  };
};