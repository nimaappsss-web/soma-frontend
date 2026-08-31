import type { GridEntryData } from "../components/TimetableGrid";

const DAY_NAMES: Record<number, string> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const keyOf = (day: string, startTime: string) => `${day}:${startTime}`;

/**
 * Returns a set of `day:startTime` keys for the lesson(s) currently in progress
 * (today, and now falls within start–end). Used to pulse "what you should be
 * doing right now" on the teacher timetable. Falls back safely on weekends.
 */
export const currentLessonKeys = (
  entries: GridEntryData[],
  now: Date = new Date(),
): Set<string> => {
  const today = DAY_NAMES[now.getDay()];
  if (!today) return new Set();

  const minutes = toMinutes(now.toTimeString().slice(0, 5));
  const keys = new Set<string>();

  for (const e of entries) {
    if (e.day !== today) continue;
    const start = toMinutes(e.startTime);
    const end = toMinutes(e.endTime);
    if (minutes >= start && minutes < end) {
      keys.add(keyOf(e.day, e.startTime));
    }
  }
  return keys;
};