import { DAYS, type DayOfWeek, type DayPeriodBlock, type ScheduleBreak, type TimetableBreak } from "../types";
import { deriveDaySchedule, timeToMin, toHHMM } from "./allocate";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const newDraftId = uid;

/** Build a schedule block and derive its period times from the start/end range + breaks. */
export const buildBlock = (
  overrides: Pick<DayPeriodBlock, "days" | "periodCount" | "startTime" | "endTime"> &
    Partial<Pick<DayPeriodBlock, "breaks" | "id">>,
): DayPeriodBlock => {
  const id = overrides.id ?? uid();
  const days = overrides.days;
  const periodCount = Math.max(1, Math.floor(overrides.periodCount) || 1);
  const startTime = overrides.startTime;
  const endTime = overrides.endTime;
  const breaks: ScheduleBreak[] = Array.isArray(overrides.breaks) ? overrides.breaks : [];
  const derived = deriveDaySchedule(startTime, endTime, periodCount, breaks);
  return { id, days, periodCount, startTime, endTime, breaks, periods: derived.periods };
};

/** Default Step-1 config: Mon–Fri, 10 periods across 08:00–16:00 with a 40-min break at 12:00. */
export const defaultSchedule = (): DayPeriodBlock[] => [
  buildBlock({
    days: [...DAYS] as DayOfWeek[],
    periodCount: 10,
    startTime: "08:00",
    endTime: "16:00",
    breaks: [{ id: uid(), label: "Break", startTime: "12:00", durationMinutes: 40 }],
  }),
];

/** Normalize a restored draft (backwards-compat: fills endTime/breaks, re-derives periods). */
export const normalizeSchedule = (schedule: DayPeriodBlock[]): DayPeriodBlock[] =>
  (Array.isArray(schedule) ? schedule : []).map((b) => {
    const breaks = Array.isArray(b.breaks) ? b.breaks : [];
    const endTime = b.endTime || "16:00";
    const periodCount = Math.max(1, Math.floor(b.periodCount || 9) || 1);
    const derived = deriveDaySchedule(b.startTime, endTime, periodCount, breaks);
    // Reconstructed configs (scheduleConfigFromTimetable) arrive without ids;
    // guarantee one so list keys stay unique (see ScheduleStep).
    return { ...b, id: b.id ?? newDraftId(), endTime, periodCount, breaks, periods: derived.periods };
  });

/** Flatten configured breaks into the per-day publish/grid rows (label · start–end). */
export const breaksFromSchedule = (schedule: DayPeriodBlock[]): TimetableBreak[] =>
  (Array.isArray(schedule) ? schedule : []).flatMap((b) =>
    b.breaks.flatMap((br) =>
      b.days.map((day) => ({
        day,
        label: br.label || "Break",
        start: br.startTime,
        end: toHHMM(timeToMin(br.startTime) + Math.floor(br.durationMinutes || 0)),
      })),
    ),
  );