import { useMemo, useState } from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { cn } from "../../../lib/utils";
import type { TimetableEntry } from "../../timetable/types";
import { lessonsForDate } from "../../timetable/utils/timetableDates";
import { buildClassColorMap } from "../../timetable/utils/classColors";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface DashboardCalendarProps {
  /** Optional lessons (e.g. a teacher's timetable) to show as class-colored dots. */
  entries?: TimetableEntry[];
}

export const DashboardCalendar = ({ entries }: DashboardCalendarProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const classColorMap = useMemo(
    () => buildClassColorMap((entries ?? []).map((e) => e.className)),
    [entries],
  );

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const lessonsOn = (day: number) => {
    if (!entries?.length) return [];
    const date = new Date(currentYear, currentMonth, day);
    return lessonsForDate(entries, date).slice(0, 3);
  };

  const monthLabel = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });

  const goToPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray900">{monthLabel} {currentYear}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray500 transition-colors hover:bg-gray50"
          >
            <ArrowLeft2 size={14} color="#8C8C8C" />
          </button>
          <button
            onClick={goToNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray500 transition-colors hover:bg-gray50"
          >
            <ArrowRight2 size={14} color="#8C8C8C" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div key={d} className="py-1.5 text-center text-[11px] font-medium text-gray500">
            {d}
          </div>
        ))}
        {blanks.map((b) => (
          <div key={`b${b}`} className="flex items-center justify-center py-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" />
          </div>
        ))}
        {days.map((day) => {
          const lessons = lessonsOn(day);
          const date = new Date(currentYear, currentMonth, day);
          const isToday = isSameDay(date, today);
          return (
            <div
              key={day}
              className="flex flex-col items-center py-0.5"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                  isToday
                    ? "bg-gray900 font-semibold text-white"
                    : "text-gray700 transition-colors hover:bg-gray50",
                )}
              >
                {day}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {lessons.map((l, i) => (
                  <span
                    key={`${date.toISOString()}-${l.id ?? i}`}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      classColorMap.get(l.className)?.split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500",
                    )}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
