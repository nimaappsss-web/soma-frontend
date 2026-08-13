import { useMemo, useState } from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { cn } from "../../../lib/utils";
import type { TimetableEntry } from "../types";
import { buildClassColorMap } from "../utils/classColors";
import { lessonsForDate } from "../utils/timetableDates";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface MonthDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}

const buildMonth = (year: number, month: number): MonthDay[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: MonthDay[] = [];
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), day: prevDays - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), day: d, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), day: d, isCurrentMonth: false });
  }
  return cells;
};

interface TeacherCalendarProps {
  entries: TimetableEntry[];
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
}

/** Stylish month view of a teacher's weekly lessons, colored by class. Day
 * numbers sit in fixed-size circles so hover/today states are always centered. */
export const TeacherCalendar = ({ entries, selectedDate, onDateSelect }: TeacherCalendarProps) => {
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const days = useMemo(() => buildMonth(year, month), [year, month]);

  const classColorMap = useMemo(() => buildClassColorMap(entries.map((e) => e.className)), [entries]);

  const goPrev = () => setView(new Date(year, month - 1, 1));
  const goNext = () => setView(new Date(year, month + 1, 1));
  const goToday = () => setView(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-input bg-card p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray900">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray500 transition-colors hover:bg-gray50"
          >
            <ArrowLeft2 size={14} color="#8C8C8C" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full px-2 py-1 text-[11px] font-medium text-gray500 transition-colors hover:bg-gray50 hover:text-gray900"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray500 transition-colors hover:bg-gray50"
          >
            <ArrowRight2 size={14} color="#8C8C8C" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-medium text-placeholder">
            {d}
          </div>
        ))}
        {days.map((cell) => {
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const lessons = lessonsForDate(entries, cell.date);
          const visible = lessons.slice(0, 3);
          const overflow = lessons.length - visible.length;
          const interactive = cell.isCurrentMonth && !!onDateSelect;

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onDateSelect?.(cell.date)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors",
                cell.isCurrentMonth ? "text-gray700" : "text-placeholder",
                interactive && "hover:bg-gray50",
                isSelected && "bg-gray100",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors",
                  isToday
                    ? "bg-gray900 font-semibold text-white"
                    : interactive
                      ? "hover:bg-gray200"
                      : "",
                  isSelected && !isToday && "bg-gray200",
                )}
              >
                {cell.day}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {visible.map((l, i) => (
                  <span
                    key={`${cell.date.toISOString()}-${l.id ?? i}`}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      classColorMap.get(l.className)?.split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500",
                    )}
                  />
                ))}
                {overflow > 0 && <span className="text-[9px] leading-none text-placeholder">+{overflow}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-input pt-3">
        {classColorMap.size > 0 ? (
          [...classColorMap.entries()].map(([name, cls]) => (
            <span key={name} className="inline-flex items-center gap-1.5 text-[11px] text-gray600">
              <span className={cn("h-2 w-2 rounded-full", cls.split(" ")[1]?.replace("text-", "bg-"))} />
              {name}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-placeholder">No lessons scheduled.</span>
        )}
      </div>
    </div>
  );
};
