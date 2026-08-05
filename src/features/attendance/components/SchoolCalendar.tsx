import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { localDateKey } from "../../../utils/date";
import type { AttendanceCalendarAnalytics } from "../types";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
interface SchoolCalendarProps {
  analytics?: AttendanceCalendarAnalytics;
  month: number;
  year: number;
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onMonthChange: (month: number, year: number) => void;
}
const cellBg = (percentage: number) => {
  if (percentage >= 80) return "bg-springgreen600 text-white";
  if (percentage >= 50) return "bg-amber500 text-white";
  return "bg-red500 text-white";
};
export const SchoolCalendar = ({
  analytics,
  month,
  year,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: SchoolCalendarProps) => {
  const dayMap = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; percentage: number; isSchoolDay: boolean; isHoliday: boolean }>();
    for (const d of analytics?.days ?? []) {
      map.set(d.date, d);
    }
    return map;
  }, [analytics]);
  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const today = localDateKey();
    const list: Array<{ key: string; dateKey: string; day: number; inMonth: boolean; isToday: boolean }> = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i);
      list.push({ key: `lead-${i}`, dateKey: localDateKey(d), day: d.getDate(), inMonth: false, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = localDateKey(new Date(year, month - 1, d));
      list.push({ key: dateKey, dateKey, day: d, inMonth: true, isToday: dateKey === today });
    }
    const remaining = 42 - list.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month, d);
      list.push({ key: `tail-${d}`, dateKey: localDateKey(date), day: d, inMonth: false, isToday: false });
    }
    return list;
  }, [month, year]);
  const goPrev = () => onMonthChange(month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year);
  const goNext = () => onMonthChange(month === 12 ? 1 : month + 1, month === 12 ? year + 1 : year);
  return (
    <div className="bg-white rounded-xl border border-gray100 p-5">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goPrev}
          className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-full hover:bg-gray50 text-gray500 transition-colors active:scale-95"
          aria-label="Previous month"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray900">
          {MONTHS[month - 1]} {year}
        </span>
        <button
          onClick={goNext}
          className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-full hover:bg-gray50 text-gray500 transition-colors active:scale-95"
          aria-label="Next month"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray400 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c) => {
          const day = dayMap.get(c.dateKey);
          const isSelected = c.dateKey === selectedDate;
          const showData = c.inMonth && !!day && day.isSchoolDay;
          return (
            <button
              key={c.key}
              onClick={() => onDateSelect(c.dateKey)}
              disabled={!c.inMonth}
              className={cn(
                "h-14 sm:h-16 flex flex-col items-center justify-center gap-1 border border-transparent rounded-lg transition-colors active:scale-95",
                c.inMonth && "hover:bg-gray50",
                isSelected && "border-gray200 bg-gray50",
                !c.inMonth && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "text-xs leading-none",
                  c.isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-gray900 text-white font-semibold"
                    : c.inMonth
                      ? "text-gray700"
                      : "text-gray300",
                )}
              >
                {c.day}
              </span>
              {showData && (
                <>
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      cellBg(day.percentage),
                    )}
                  >
                    {day.percentage}%
                  </span>
                  <span
                    className={cn(
                      "sm:hidden h-1.5 w-1.5 rounded-full",
                      day.percentage >= 80
                        ? "bg-springgreen600"
                        : day.percentage >= 50
                          ? "bg-amber500"
                          : "bg-red500",
                    )}
                  />
                </>
              )}
              {c.inMonth && day?.isHoliday && (
                <span className="hidden sm:block h-1 w-1 rounded-full bg-amber500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
