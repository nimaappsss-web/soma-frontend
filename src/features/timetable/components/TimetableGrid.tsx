import { useMemo } from "react";
import { cn } from "../../../lib/utils";
import { DAYS, type DayOfWeek, type TimetableBreak } from "../types";
import { gridRowsFromTimes, overlaps } from "../utils/allocate";
import { SUBJECT_COLORS, buildSubjectColorMap } from "../utils/subjectColors";
import { buildClassColorMap } from "../utils/classColors";

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
  /** Color cells by subject (default) or by class (teacher view). */
  colorBy?: "subject" | "class";
  /** Set of `day:startTime` keys for the currently in-progress lesson(s). */
  nowKeys?: Set<string>;
  emptyHint?: string;
}

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
  colorFor: (slot: GridEntryData) => string;
  onCellClick?: (day: string, period: number) => void;
  showTeacher: boolean;
  showClass: boolean;
  nowKeys?: Set<string>;
  emptyHint?: string;
}

const GridTable = ({
  days,
  entries,
  breaks,
  busy,
  periodsPerDay,
  colorFor,
  onCellClick,
  showTeacher,
  showClass,
  nowKeys,
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
                          colorFor(slot),
                          onCellClick && "cursor-pointer hover:brightness-95",
                          busyCell && "ring-2 ring-red400",
                          nowKeys?.has(`${day}:${slot.startTime}`) && "current-pulse",
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
  colorBy = "subject",
  nowKeys,
  emptyHint,
}: TimetableGridProps) => {
  const groups = useMemo(() => groupDaysBySignature(entries, breaks), [entries, breaks]);

  const colorFor = useMemo(() => {
    if (colorBy === "class") {
      const classMap = buildClassColorMap(entries.map((e) => e.className ?? ""));
      return (slot: GridEntryData) => classMap.get(slot.className ?? "") ?? SUBJECT_COLORS[0];
    }
    const subjectMap = buildSubjectColorMap(entries);
    return (slot: GridEntryData) => subjectMap.get(slot.subjectId) ?? SUBJECT_COLORS[0];
  }, [colorBy, entries]);

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
              colorFor={colorFor}
              onCellClick={onCellClick}
              showTeacher={showTeacher}
              showClass={showClass}
              nowKeys={nowKeys}
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