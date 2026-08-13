import type { DayOfWeek, TimetableEntry } from "../types";
import { timeToMin } from "./allocate";

const JS_DAY_TO_DAY: Record<number, DayOfWeek> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
};

/** Map a JS Date#getDay() (0=Sunday..6=Saturday) to a school day, or null on weekends. */
export const jsDayToDayOfWeek = (jsDay: number): DayOfWeek | null => JS_DAY_TO_DAY[jsDay] ?? null;

/** Whole minutes from now until a "HH:MM" time (negative = already passed). */
export const minutesUntil = (time: string, now: Date): number =>
  timeToMin(time) - (now.getHours() * 60 + now.getMinutes());

/** Format "HH:MM" (24-hour) as "h:mm AM/PM". */
export const to12Hour = (time: string): string => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

/** Today's lessons (from a teacher's full entry list), sorted by start time. */
export const entriesForToday = (
  entries: TimetableEntry[],
  now: Date = new Date(),
): TimetableEntry[] => {
  const day = jsDayToDayOfWeek(now.getDay());
  if (!day) return [];
  return (entries ?? [])
    .filter((e) => e.day === day)
    .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
};

export type NextClassStatus = "ongoing" | "upcoming" | "done" | "none";

export interface NextClass {
  status: NextClassStatus;
  entry: TimetableEntry | null;
  minutes: number;
}

/**
 * The next class for the day, relative to `now`:
 * - "ongoing"  — a class is running right now (`minutes` = minutes left)
 * - "upcoming" — next class starts in `minutes` minutes
 * - "done"     — all of today's classes have ended
 * - "none"     — no classes scheduled today
 */
export const nextClass = (entries: TimetableEntry[], now: Date = new Date()): NextClass => {
  const today = entriesForToday(entries, now);
  if (today.length === 0) return { status: "none", entry: null, minutes: 0 };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const e of today) {
    const start = timeToMin(e.startTime);
    const end = timeToMin(e.endTime);
    if (nowMin < start) return { status: "upcoming", entry: e, minutes: start - nowMin };
    if (nowMin >= start && nowMin < end) return { status: "ongoing", entry: e, minutes: end - nowMin };
  }
  return { status: "done", entry: null, minutes: 0 };
};

/** Human greeting line for the dashboard header. */
export const greetingFor = (next: NextClass): string => {
  if (next.status === "none") return "No classes scheduled today.";
  if (next.status === "done") return "You're all done for today — enjoy the rest of the day!";
  if (!next.entry) return "No classes scheduled today.";
  const label = `${next.entry.subjectName || "Class"} · ${next.entry.className}`;
  if (next.status === "ongoing") return `In ${label} right now — ends in ${next.minutes} min.`;
  return `${label} in ${next.minutes} min.`;
};
