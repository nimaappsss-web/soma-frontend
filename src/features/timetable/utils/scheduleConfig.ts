import {
  DAYS,
  type DayOfWeek,
  type DayPeriodBlock,
  type DoublePeriodConfig,
  type ScheduleBreak,
  type TimetableBreak,
  type TimetableEntry,
} from "../types";
import { timeToMin } from "./allocate";
import { newDraftId, normalizeSchedule } from "./draft";

type EntryLike = { day: string; startTime: string; endTime: string };

const blockSig = (b: DayPeriodBlock): string =>
  JSON.stringify({
    days: [...b.days].sort(),
    periodCount: b.periodCount,
    startTime: b.startTime,
    endTime: b.endTime,
    breaks: (b.breaks ?? []).map((br) => [br.label, br.startTime, br.durationMinutes]),
  });

/** Structural equality of two schedule configs (ignores ids/derived period times). */
export const schedulesEqual = (a: DayPeriodBlock[], b: DayPeriodBlock[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((blk, i) => blockSig(blk) === blockSig(b[i]));
};

/**
 * Reconstruct a wizard schedule configuration (DayPeriodBlock[]) from a class's
 * published timetable entries + breaks — the source for "copy schedule from
 * another class". Days are grouped by their period-grid signature (distinct
 * start times AND break windows), so e.g. a shortened Friday becomes its own
 * block. Period times are re-derived through normalizeSchedule, which is exactly
 * how the wizard computes them, so the copy matches the original closely.
 */
export const scheduleConfigFromTimetable = (
  entries: EntryLike[],
  breaks: TimetableBreak[] = [],
): DayPeriodBlock[] => {
  const list = entries ?? [];

  const dayEntries = new Map<DayOfWeek, EntryLike[]>();
  for (const e of list) {
    if (!e.day || !e.startTime || !e.endTime) continue;
    const day = e.day as DayOfWeek;
    if (!(DAYS as readonly string[]).includes(e.day)) continue;
    dayEntries.set(day, [...(dayEntries.get(day) ?? []), e]);
  }

  const breaksByDay = new Map<DayOfWeek, TimetableBreak[]>();
  for (const b of breaks ?? []) {
    if (!b?.day) continue;
    const day = b.day as DayOfWeek;
    breaksByDay.set(day, [...(breaksByDay.get(day) ?? []), b]);
  }

  const signatureFor = (day: DayOfWeek): string => {
    const starts = [...new Set((dayEntries.get(day) ?? []).map((e) => e.startTime))].sort();
    const bs = (breaksByDay.get(day) ?? [])
      .map((b) => `${b.start ?? ""}-${b.end ?? ""}`)
      .sort();
    return `${starts.join(",")}|${bs.join(",")}`;
  };

  const groups = new Map<string, DayOfWeek[]>();
  for (const day of DAYS) {
    if (!dayEntries.has(day)) continue;
    const sig = signatureFor(day);
    const arr = groups.get(sig) ?? [];
    arr.push(day);
    groups.set(sig, arr);
  }

  if (groups.size === 0) return [];

  const blocks: Array<
    Pick<DayPeriodBlock, "days" | "periodCount" | "startTime" | "endTime" | "breaks">
  > = [];
  for (const [, days] of groups) {
    const sampleDay = days[0];
    const ents = dayEntries.get(sampleDay) ?? [];
    const starts = [...new Set(ents.map((e) => e.startTime))].sort();
    const periodCount = starts.length;
    const startTime = ents.reduce(
      (min, e) => (timeToMin(e.startTime) < timeToMin(min) ? e.startTime : min),
      ents[0].startTime,
    );
    const endTime = ents.reduce(
      (max, e) => (timeToMin(e.endTime) > timeToMin(max) ? e.endTime : max),
      ents[0].endTime,
    );
    const blockBreaks: ScheduleBreak[] = (breaksByDay.get(sampleDay) ?? []).map((b) => ({
      id: newDraftId(),
      label: b.label || "Break",
      startTime: b.start,
      durationMinutes: Math.max(5, timeToMin(b.end) - timeToMin(b.start)),
    }));
    blocks.push({ days, periodCount, startTime, endTime, breaks: blockBreaks });
  }

  blocks.sort((a, b) => DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]));

  return normalizeSchedule(blocks as DayPeriodBlock[]);
};

export interface TimetableConfigFromEntries {
  /** Subjects actually present in the published timetable, in first-seen order. */
  subjectIds: string[];
  /** Weekly target per subject = number of published entries for that subject. */
  targets: Record<string, number>;
  /** Days where a subject occupies two adjacent slots (a double period). */
  doublePeriods: DoublePeriodConfig[];
}

/**
 * Reconstruct the wizard's subject configuration (selected subjects, weekly
 * targets, double periods) from a class's published timetable entries — used to
 * restore edit mode exactly as it was before publishing. A double period is
 * detected by a subject occupying two adjacent period numbers on the same day,
 * matching how allocateTimetable places doubles (tryPlaceDouble).
 */
export const timetableConfigFromEntries = (
  entries: Array<Pick<TimetableEntry, "subjectId" | "day" | "period">>,
): TimetableConfigFromEntries => {
  const list = entries ?? [];
  const targets: Record<string, number> = {};
  const byDay = new Map<string, Map<DayOfWeek, number[]>>();
  for (const e of list) {
    if (!e.subjectId || !e.day) continue;
    targets[e.subjectId] = (targets[e.subjectId] ?? 0) + 1;
    let m = byDay.get(e.subjectId);
    if (!m) {
      m = new Map<DayOfWeek, number[]>();
      byDay.set(e.subjectId, m);
    }
    const arr = m.get(e.day) ?? [];
    arr.push(e.period);
    m.set(e.day, arr);
  }

  const doublePeriods: DoublePeriodConfig[] = [];
  for (const [subjectId, m] of byDay) {
    const days: DayOfWeek[] = [];
    for (const [day, periods] of m) {
      const sorted = [...periods].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1] - sorted[i] === 1) {
          days.push(day);
          break;
        }
      }
    }
    if (days.length) doublePeriods.push({ subjectId, days });
  }

  return {
    subjectIds: Array.from(new Set(list.map((e) => e.subjectId))),
    targets,
    doublePeriods,
  };
};
