import type { DayOfWeek, TimetableEntry } from "../types";
import { jsDayToDayOfWeek } from "./todaySchedule";

/**
 * Lessons scheduled on a specific calendar date, resolved through the weekday
 * bridge (a timetable entry's `day` is a weekday name, not a date). Weekends
 * have no school day and return []. Used by the month-calendar view.
 */
export const lessonsForDate = (
  entries: TimetableEntry[],
  date: Date,
): TimetableEntry[] => {
  const day = jsDayToDayOfWeek(date.getDay());
  if (!day) return [];
  return (entries ?? []).filter((e) => e.day === day);
};

/** The classes a teacher's entries cover, deduped and in first-seen order. */
export const distinctClasses = (entries: TimetableEntry[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries ?? []) {
    if (!e.className) continue;
    if (seen.has(e.className)) continue;
    seen.add(e.className);
    out.push(e.className);
  }
  return out;
};

/** Count weekly lessons per class name. */
export const lessonsPerClass = (entries: TimetableEntry[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const e of entries ?? []) {
    if (!e.className) continue;
    counts.set(e.className, (counts.get(e.className) ?? 0) + 1);
  }
  return counts;
};

export type { DayOfWeek };
