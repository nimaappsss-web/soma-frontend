import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { db, type TimetableCache, type TimetableEntryCache } from "../../../db/db";
import { scheduleConfigFromTimetable, timetableConfigFromEntries } from "../utils/scheduleConfig";
import type { DayPeriodBlock, TimetableBreak, TimetableEntry, TimetableListResponse } from "../types";

const toEntryCache = (userId: string, e: TimetableEntry): TimetableEntryCache => ({
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
  updatedAt: Date.now(),
});

export interface ScheduleTemplate {
  classId: string;
  className: string;
  config: DayPeriodBlock[];
  weeklySlots: number;
  hasBreaks: boolean;
}

export interface SubjectTemplate {
  classId: string;
  className: string;
  config: ReturnType<typeof timetableConfigFromEntries>;
  subjectCount: number;
  targetSum: number;
}

interface CacheSnapshot {
  entries: TimetableEntryCache[];
  breaksByClass: Map<string, TimetableBreak[]>;
}

/**
 * Offline-first source list of other classes' schedule configurations for the
 * "copy schedule from another class" control. Dexie is the source of truth:
 * published/queued classes already live in `timetableEntries` (+ breaks in
 * `timetables`), so the list and the reconstructed configs work fully offline.
 * While online, the cache is hydrated once with the whole school's timetable
 * (merge-only — never deletes, so offline queued drafts are never wiped).
 */
export const useScheduleTemplates = (excludeClassId?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [snapshot, setSnapshot] = useState<CacheSnapshot | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const sub = liveQuery(() =>
      Promise.all([
        db.timetableEntries.where("userId").equals(userId).toArray(),
        db.timetables.where("userId").equals(userId).toArray(),
      ]),
    ).subscribe({
      next: ([entries, headers]) => {
        const breaksByClass = new Map<string, TimetableBreak[]>();
        for (const h of headers as TimetableCache[]) {
          let parsed: TimetableBreak[] = [];
          try {
            parsed = JSON.parse(h.breaksJson || "[]");
          } catch {
            parsed = [];
          }
          breaksByClass.set(h.classId, parsed);
        }
        setSnapshot({
          entries: entries as TimetableEntryCache[],
          breaksByClass,
        });
      },
    });
    return () => sub.unsubscribe();
  }, [userId]);

  // Online hydration — merge-only write, silent on network failure.
  useQuery<TimetableListResponse, unknown>({
    queryKey: ["timetableTemplates", userId],
    queryFn: async () => {
      try {
        const res = await fetchData<TimetableListResponse>("/timetable", "GET");

        // Write entries + header breaks in ONE transaction. liveQuery emits
        // once per transaction, so the copy control never sees an intermediate
        // state (entries present, breaks not yet) — otherwise clicking a card
        // in that window applies a config without breaks.
        await db.transaction("rw", db.timetableEntries, db.timetables, async () => {
          if (res.entries?.length) {
            await db.timetableEntries.bulkPut(res.entries.map((e) => toEntryCache(userId, e)));
          }

          const breaksByClass = res.breaksByClass ?? {};
          if (Object.keys(breaksByClass).length) {
            const classNameByClass = new Map<string, string>();
            for (const e of res.entries ?? []) classNameByClass.set(e.classId, e.className);
            const existing = await db.timetables.where("userId").equals(userId).toArray();
            const existingById = new Map(existing.map((h) => [h.classId, h]));
            const headers: TimetableCache[] = Object.entries(breaksByClass).map(
              ([classId, brk]) => {
                const prev = existingById.get(classId);
                return {
                  id: classId,
                  userId,
                  classId,
                  className: prev?.className ?? classNameByClass.get(classId) ?? "",
                  title: prev?.title ?? "",
                  breaksJson: JSON.stringify(brk ?? []),
                  updatedAt: Date.now(),
                };
              },
            );
            if (headers.length) await db.timetables.bulkPut(headers);
          }
        });
        return res;
      } catch {
        return { entries: [], breaks: [] };
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const templates: ScheduleTemplate[] = (() => {
    if (!snapshot) return [];
    const byClass = new Map<string, { className: string; entries: TimetableEntryCache[] }>();
    for (const e of snapshot.entries) {
      const row = byClass.get(e.classId) ?? { className: e.className ?? "", entries: [] };
      row.entries.push(e);
      byClass.set(e.classId, row);
    }

    const out: ScheduleTemplate[] = [];
    for (const [classId, row] of byClass) {
      if (classId === excludeClassId) continue;
      const breaks = snapshot.breaksByClass.get(classId) ?? [];
      const config = scheduleConfigFromTimetable(row.entries, breaks);
      if (config.length === 0) continue;
      const weeklySlots = config.reduce((sum, b) => sum + b.periodCount * b.days.length, 0);
      out.push({
        classId,
        className: row.className || classId,
        config,
        weeklySlots,
        hasBreaks: breaks.length > 0,
      });
    }
    return out.sort((a, b) => a.className.localeCompare(b.className));
  })();

  const subjectTemplates: SubjectTemplate[] = (() => {
    if (!snapshot) return [];
    const byClass = new Map<string, { className: string; entries: TimetableEntryCache[] }>();
    for (const e of snapshot.entries) {
      const row = byClass.get(e.classId) ?? { className: e.className ?? "", entries: [] };
      row.entries.push(e);
      byClass.set(e.classId, row);
    }

    const out: SubjectTemplate[] = [];
    for (const [classId, row] of byClass) {
      if (classId === excludeClassId) continue;
      const config = timetableConfigFromEntries(row.entries);
      if (config.subjectIds.length === 0) continue;
      const targetSum = Object.values(config.targets).reduce((a, b) => a + b, 0);
      out.push({
        classId,
        className: row.className || classId,
        config,
        subjectCount: config.subjectIds.length,
        targetSum,
      });
    }
    return out.sort((a, b) => a.className.localeCompare(b.className));
  })();

  return {
    templates,
    subjectTemplates,
    isLoading: snapshot === undefined,
  };
};
