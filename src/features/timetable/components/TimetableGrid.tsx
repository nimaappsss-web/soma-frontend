import { useMemo } from "react";
import { cn } from "../../../lib/utils";
import { DAYS, type DayOfWeek, type TimetableBreak } from "../types";
import { gridRowsFromTimes, overlaps } from "../utils/allocate";

export interface GridEntryData {
  subjectId: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  className?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
}

interface BusyWindow {
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  className?: string;
}

interface TimetableGridProps {
  periodsPerDay: number;
  entries: GridEntryData[];
  breaks?: TimetableBreak[];
  busy?: BusyWindow[];
  onCellClick?: (day: string, period: number) => void;
  showTeacher?: boolean;
  showClass?: boolean;
  emptyHint?: string;
}

/**
 * Stable per-subject colors: derived purely from the subject id, so the same
 * subject renders with the exact same color everywhere it appears (double
 * periods, later periods, regenerations, desktop and mobile). 50 swatches keep
 * different subjects visually distinct even in large schools.
 */
/**
 * Ordered so that neighbouring swatches belong to different hue families. This
 * matters because subjects are assigned colours by their sorted index, so the
 * closer two subjects sit in the array, the more their colours must differ.
 */
const SUBJECT_COLORS = [
  "bg-azure500/10 text-azure500",
  "bg-red400/10 text-red500",
  "bg-teal500/10 text-teal500",
  "bg-lime500/10 text-lime500",
  "bg-orange400/10 text-orange600",
  "bg-indigo500/10 text-indigo500",
  "bg-slate500/10 text-slate600",
  "bg-orange500/10 text-orange700",
  "bg-slate600/10 text-slate600",
  "bg-sky500/10 text-sky500",
  "bg-red500/10 text-red500",
  "bg-teal600/10 text-teal600",
  "bg-yellow500/10 text-yellow500",
  "bg-fuchsia500/10 text-fuchsia500",
  "bg-yellow600/10 text-yellow600",
  "bg-fuchsia600/10 text-fuchsia600",
  "bg-orange600/10 text-orange700",
  "bg-stone500/10 text-stone600",
  "bg-blue500/10 text-blue500",
  "bg-rose500/10 text-rose500",
  "bg-emerald500/10 text-emerald500",
  "bg-rose600/10 text-rose600",
  "bg-emerald600/10 text-emerald600",
  "bg-amber400/20 text-amber500",
  "bg-purple400/10 text-purple500",
  "bg-blue600/10 text-blue600",
  "bg-violet700/10 text-violet700",
  "bg-rose700/10 text-rose700",
  "bg-green500/10 text-green500",
  "bg-amber500/10 text-amber600",
  "bg-purple500/10 text-purple500",
  "bg-green600/10 text-green600",
  "bg-purple600/10 text-purple600",
  "bg-azure600/10 text-azure600",
  "bg-crimson400/10 text-crimson500",
  "bg-violet500/10 text-violet500",
  "bg-cyan500/10 text-cyan500",
  "bg-crimson500/10 text-red500",
  "bg-green700/10 text-green700",
  "bg-cyan600/10 text-cyan600",
  "bg-pink500/10 text-pink500",
  "bg-springgreen600/10 text-springgreen600",
  "bg-violet600/10 text-violet600",
  "bg-blue700/10 text-blue700",
  "bg-pink600/10 text-pink600",
  "bg-mint800/10 text-mint800",
  "bg-indigo600/10 text-indigo600",
  "bg-green400/10 text-green700",
  "bg-pink700/10 text-pink700",
  "bg-indigo700/10 text-indigo700",
];

/**
 * Assigns each subject a guaranteed-unique swatch by sorted subject id, so the
 * mapping is deterministic (stable across regenerations) and no two subjects in
 * the same timetable ever share a colour.
 */
export const buildSubjectColorMap = (entries: Array<{ subjectId?: string }>): Map<string, string> => {
  const ids = Array.from(new Set(entries.map((e) => e.subjectId).filter(Boolean))).sort();
  const map = new Map<string, string>();
  ids.forEach((id, i) => map.set(id, SUBJECT_COLORS[i % SUBJECT_COLORS.length]));
  return map;
};

/** Solid `bg-*` token (no tint) for a swatch — used for small markers. */
export const solidSwatch = (cls: string): string =>
  cls.split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500";

const labelFor = (d: DayOfWeek) => d.charAt(0) + d.slice(1).toLowerCase();

const rangeLabel = (days: DayOfWeek[]): string => {
  if (days.length <= 1) return labelFor(days[0]);
  return `${labelFor(days[0])} – ${labelFor(days[days.length - 1])}`;
};

interface GridTableProps {
  days: DayOfWeek[];
  entries: GridEntryData[];
  breaks: TimetableBreak[];
  busy: BusyWindow[];
  periodsPerDay: number;
  subjectColorMap: Map<string, string>;
  onCellClick?: (day: string, period: number) => void;
  showTeacher: boolean;
  showClass: boolean;
  emptyHint?: string;
}

const GridTable = ({
  days,
  entries,
  breaks,
  busy,
  periodsPerDay,
  subjectColorMap,
  onCellClick,
  showTeacher,
  showClass,
  emptyHint,
}: GridTableProps) => {
  const periodTimes = useMemo(
    () => gridRowsFromTimes(entries, breaks, periodsPerDay),
    [entries, breaks, periodsPerDay],
  );

  const bySlot = useMemo(() => {
    const map = new Map<string, GridEntryData>();
    for (const e of entries) map.set(`${e.day}:${e.startTime}`, e);
    return map;
  }, [entries]);

  const breakByDayStart = useMemo(() => {
    const map = new Map<string, TimetableBreak>();
    for (const b of breaks) map.set(`${b.day}:${b.start}`, b);
    return map;
  }, [breaks]);

  const isBusy = (day: string, slot: GridEntryData) => {
    if (!slot.teacherId) return false;
    return busy.some(
      (b) =>
        b.teacherId === slot.teacherId &&
        b.day === day &&
        overlaps(b.startTime, b.endTime, slot.startTime, slot.endTime),
    );
  };

  return (
    <table className="w-full min-w-[760px] border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky left-0 z-10 bg-background px-3 py-3 text-left text-xs font-medium text-placeholder">
            Period
          </th>
          {days.map((day, i) => (
            <th
              key={day}
              className={cn(
                "px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-placeholder",
                i % 2 === 1 && "bg-accent/40",
              )}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {periodTimes.map((t) => {
          const isBreakRow = t.isBreak;
          return (
            <tr
              key={t.start}
              className={cn("border-t border-input", isBreakRow && "bg-amber400/5")}
            >
              <td className="sticky left-0 z-10 bg-background px-3 py-2 align-top text-xs text-placeholder">
                <span className="font-medium text-gray900">
                  {isBreakRow ? "Break" : `P${t.period}`}
                </span>
                <span className="block text-[11px]">
                  {t.start}–{t.end}
                </span>
              </td>
              {days.map((day, i) => {
                const slot = bySlot.get(`${day}:${t.start}`);
                const busyCell = slot ? isBusy(day, slot) : false;
                const dayBreak = breakByDayStart.get(`${day}:${t.start}`);
                if (dayBreak) {
                  return (
                    <td
                      key={day}
                      className={cn(
                        "border-l border-input p-1",
                        i % 2 === 1 && "bg-accent/40",
                      )}
                    >
                      <div className="flex h-full min-h-[44px] w-full items-center justify-center gap-1 rounded-lg bg-amber400/10 px-2 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber500">
                          {dayBreak.label}
                        </span>
                        <span className="text-[10px] tabular-nums text-amber500/70">
                          {dayBreak.start}–{dayBreak.end}
                        </span>
                      </div>
                    </td>
                  );
                }
                return (
                  <td
                    key={day}
                    className={cn(
                      "min-h-[52px] border-l border-input align-top p-1",
                      i % 2 === 1 && "bg-accent/40",
                    )}
                  >
                    {slot ? (
                      <button
                        type="button"
                        disabled={!onCellClick}
                        onClick={() => onCellClick?.(day, t.period)}
                        className={cn(
                          "flex h-full w-full min-h-[44px] cursor-default flex-col justify-center rounded-lg px-2 py-1 text-left transition-colors",
                          subjectColorMap.get(slot.subjectId) ?? SUBJECT_COLORS[0],
                          onCellClick && "cursor-pointer hover:brightness-95",
                          busyCell && "ring-2 ring-red400",
                        )}
                      >
                        <span className="text-[13px] font-semibold leading-tight">
                          {slot.subjectName || "Subject"}
                        </span>
                        {showClass && slot.className && (
                          <span className="mt-0.5 inline-flex w-fit items-center rounded-md bg-black/10 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-black">
                            {slot.className}
                          </span>
                        )}
                        {showTeacher && slot.teacherName && (
                          <span className="truncate text-[11px] opacity-80">{slot.teacherName}</span>
                        )}
                        {busyCell && (
                          <span className="text-[10px] font-semibold text-red500">Clash</span>
                        )}
                      </button>
                    ) : (
                      onCellClick && (
                        <button
                          type="button"
                          onClick={() => onCellClick(day, t.period)}
                          className="flex h-full w-full min-h-[44px] items-center justify-center rounded-lg text-[11px] text-placeholder transition-colors hover:bg-accent hover:text-gray500"
                        >
                          +
                        </button>
                      )
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {!periodTimes.length && (
          <tr>
            <td colSpan={days.length + 1} className="px-4 py-10 text-center text-sm text-placeholder">
              {emptyHint ?? "No periods configured"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

/**
 * Split the weekdays into groups that share the same period start-times. A
 * schedule with multiple "configurations" (e.g. a shortened Friday) renders
 * each group as its own labelled table with its own horizontal scroll and
 * sticky period column, instead of merging two different period grids into
 * overlapping rows full of empty cells.
 */
const groupDaysBySignature = (entries: GridEntryData[], breaks: TimetableBreak[]): DayOfWeek[][] => {
  const startsFor = (day: DayOfWeek) => {
    const starts = new Set<string>();
    for (const e of entries) if (e.day === day) starts.add(e.startTime);
    for (const b of breaks) if (b.day === day) starts.add(b.start);
    return [...starts].sort().join("|");
  };

  const buckets = new Map<string, DayOfWeek[]>();
  for (const day of DAYS) {
    const sig = startsFor(day);
    const arr = buckets.get(sig) ?? [];
    arr.push(day);
    buckets.set(sig, arr);
  }

  return [...buckets.values()].sort((a, b) => DAYS.indexOf(a[0]) - DAYS.indexOf(b[0]));
};

export const TimetableGrid = ({
  periodsPerDay,
  entries,
  breaks = [],
  busy = [],
  onCellClick,
  showTeacher = true,
  showClass = false,
  emptyHint,
}: TimetableGridProps) => {
  const groups = useMemo(() => groupDaysBySignature(entries, breaks), [entries, breaks]);

  const subjectColorMap = useMemo(() => buildSubjectColorMap(entries), [entries]);

  if (groups.length === 0) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-input">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <tbody>
            <tr>
              <td colSpan={DAYS.length + 1} className="px-4 py-10 text-center text-sm text-placeholder">
                {emptyHint ?? "No periods configured"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((days) => {
        const groupEntries = entries.filter((e) => days.includes(e.day as DayOfWeek));
        const groupBreaks = breaks.filter((b) => days.includes(b.day));
        const table = (
          <div className="w-full overflow-x-auto rounded-xl border border-input">
            <GridTable
              days={days}
              entries={groupEntries}
              breaks={groupBreaks}
              busy={busy}
              periodsPerDay={periodsPerDay}
              subjectColorMap={subjectColorMap}
              onCellClick={onCellClick}
              showTeacher={showTeacher}
              showClass={showClass}
              emptyHint={emptyHint}
            />
          </div>
        );
        if (groups.length === 1) return <div key={days.join(",")}>{table}</div>;
        return (
          <div key={days.join(",")}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-placeholder">
              {rangeLabel(days)}
            </p>
            {table}
          </div>
        );
      })}
    </div>
  );
};