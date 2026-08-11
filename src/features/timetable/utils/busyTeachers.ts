import { db } from "../../../db/db";
import type { BusyTeacher } from "../types";

type EntryLike = {
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  day: string;
  startTime: string;
  endTime: string;
};

/** Convert cached timetable-entry rows (any class) into teacher busy windows. */
export const busyTeachersFromEntries = (entries: EntryLike[]): BusyTeacher[] =>
  (entries ?? []).map((e) => ({
    teacherId: e.teacherId,
    teacherName: e.teacherName ?? "",
    classId: e.classId,
    className: e.className ?? "",
    day: e.day,
    startTime: e.startTime,
    endTime: e.endTime,
  }));

/**
 * Read every published/queued timetable entry from Dexie for the user, excluding
 * the class currently being built, as teacher busy windows. This is what makes
 * cross-class teacher-clash avoidance work while offline — publishes write to
 * this table before the queue syncs to the server.
 */
export const busyTeachersFromCache = async (
  userId: string,
  excludeClassId: string,
): Promise<BusyTeacher[]> => {
  if (!userId || !excludeClassId) return [];
  const rows = await db.timetableEntries
    .where("userId")
    .equals(userId)
    .filter((e) => e.classId !== excludeClassId)
    .toArray();
  return busyTeachersFromEntries(rows);
};

/** Merge server + locally-derived busy windows, dropping exact duplicates. */
export const mergeBusyTeachers = (
  server: BusyTeacher[],
  local: BusyTeacher[],
): BusyTeacher[] => {
  const seen = new Set<string>();
  return [...(server ?? []), ...(local ?? [])].filter((b) => {
    const key = `${b.teacherId}|${b.classId}|${b.day}|${b.startTime}|${b.endTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
