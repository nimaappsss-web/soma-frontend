import { useMemo } from "react";
import { cn } from "../../../lib/utils";
import { DAYS, type TimetableBreak } from "../types";
import { gridRowsFromTimes, overlaps } from "../utils/allocate";
import { buildSubjectColorMap, solidSwatch, type GridEntryData } from "./TimetableGrid";

interface TimetableMobileProps {
  periodsPerDay: number;
  entries: GridEntryData[];
  breaks?: TimetableBreak[];
  busy?: Array<{ teacherId: string; day: string; startTime: string; endTime: string; className?: string }>;
  onCellClick?: (day: string, period: number) => void;
  showClass?: boolean;
}

export const TimetableMobile = ({
  periodsPerDay,
  entries,
  breaks = [],
  busy = [],
  onCellClick,
  showClass = false,
}: TimetableMobileProps) => {
  const periodTimes = useMemo(
    () => gridRowsFromTimes(entries, breaks, periodsPerDay),
    [entries, breaks, periodsPerDay],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, GridEntryData[]>();
    for (const e of entries) {
      const arr = map.get(e.day) ?? [];
      arr.push(e);
      map.set(e.day, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.period - b.period);
    return map;
  }, [entries]);

  const subjectColorMap = useMemo(() => buildSubjectColorMap(entries), [entries]);

  return (
    <div className="space-y-4">
      {DAYS.map((day) => {
        const cells = byDay.get(day) ?? [];
        const dayBreaks = breaks.filter((b) => b.day === day);
        if (cells.length === 0 && dayBreaks.length === 0 && !onCellClick) return null;
        return (
          <div key={day} className="rounded-xl border border-input bg-card p-3">
            <h4 className="sticky top-0 z-10 -mx-3 -mt-3 mb-2 rounded-t-xl border-b border-input bg-pureWhite px-3 pb-2 pt-3 text-sm font-semibold text-gray900">
              {day}
            </h4>
            <div className="space-y-1.5">
              {periodTimes.map((t) => {
                const slot = cells.find((c) => c.startTime === t.start);
                const dayBreak = dayBreaks.find((b) => b.start === t.start);
                const clash = slot?.teacherId
                  ? busy.some(
                      (b) =>
                        b.teacherId === slot.teacherId &&
                        b.day === day &&
                        overlaps(b.startTime, b.endTime, slot!.startTime, slot!.endTime),
                    )
                  : false;

                if (dayBreak) {
                  return (
                    <div
                      key={t.period}
                      className="flex items-center justify-between rounded-lg bg-amber400/10 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-amber500">{dayBreak.label}</span>
                      <span className="text-placeholder">
                        {dayBreak.start}–{dayBreak.end}
                      </span>
                    </div>
                  );
                }

                if (slot) {
                  return (
                    <button
                      key={t.period}
                      type="button"
                      disabled={!onCellClick}
                      onClick={() => onCellClick?.(day, t.period)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left",
                        "bg-gray50",
                        onCellClick && "active:bg-accent",
                        clash && "ring-2 ring-red400",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            solidSwatch(subjectColorMap.get(slot.subjectId) ?? "bg-gray200 text-gray500"),
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-gray900">
                            {slot.subjectName || "Subject"}
                          </p>
                          {showClass && slot.className && (
                            <span className="mt-0.5 inline-flex w-fit items-center rounded-md bg-black/10 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-black">
                              {slot.className}
                            </span>
                          )}
                          {slot.teacherName && (
                            <p className="truncate text-[11px] text-placeholder">{slot.teacherName}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[11px] text-placeholder">
                          {slot.startTime}–{slot.endTime}
                        </span>
                        {clash && (
                          <p className="text-[10px] font-semibold text-red500">Clash</p>
                        )}
                      </div>
                    </button>
                  );
                }

                if (onCellClick) {
                  return (
                    <button
                      key={t.period}
                      type="button"
                      onClick={() => onCellClick(day, t.period)}
                      className="flex w-full items-center justify-between rounded-lg border border-dashed border-input px-3 py-2 text-xs text-placeholder active:bg-accent"
                    >
                      <span>{t.start}–{t.end}</span>
                      <span>+ add</span>
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};