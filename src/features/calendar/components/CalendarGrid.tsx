import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Holiday } from "../types";

const TYPE_COLORS: Record<string, string> = {
  EVENT: "bg-blue-500",
  EXAM: "bg-purple-500",
  MEETING: "bg-amber-500",
  SPORTS: "bg-green-500",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayInfo {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isOutsideTerm: boolean;
  events: CalendarEvent[];
  holidays: Holiday[];
}

interface CalendarGridProps {
  currentMonth: Date;
  events: CalendarEvent[];
  holidays: Holiday[];
  termRange: { start: string; end: string } | null;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const buildDays = (
  year: number,
  month: number,
  events: CalendarEvent[],
  holidays: Holiday[],
  termRange: { start: string; end: string } | null,
): DayInfo[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const eventMap = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.date.slice(0, 10);
    if (!eventMap.has(key)) eventMap.set(key, []);
    eventMap.get(key)!.push(e);
  }

  const holidayMap = new Map<string, Holiday[]>();
  for (const h of holidays) {
    const key = h.date.slice(0, 10);
    if (!holidayMap.has(key)) holidayMap.set(key, []);
    holidayMap.get(key)!.push(h);
  }

  const isOutside = (date: Date) => {
    if (!termRange) return false;
    const key = localDateKey(date);
    return key < termRange.start || key > termRange.end;
  };

  const cells: DayInfo[] = [];

  const prevMonth = new Date(year, month, 0);
  const daysInPrev = prevMonth.getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const date = new Date(year, month - 1, d);
    const key = localDateKey(date);
    cells.push({
      date,
      day: d,
      isCurrentMonth: false,
      isToday: false,
      isOutsideTerm: isOutside(date),
      events: eventMap.get(key) ?? [],
      holidays: holidayMap.get(key) ?? [],
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = localDateKey(date);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    cells.push({
      date,
      day: d,
      isCurrentMonth: true,
      isToday,
      isOutsideTerm: isOutside(date),
      events: eventMap.get(key) ?? [],
      holidays: holidayMap.get(key) ?? [],
    });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const key = localDateKey(date);
    cells.push({
      date,
      day: d,
      isCurrentMonth: false,
      isToday: false,
      isOutsideTerm: isOutside(date),
      events: eventMap.get(key) ?? [],
      holidays: holidayMap.get(key) ?? [],
    });
  }

  return cells;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const CalendarGrid = ({
  currentMonth,
  events,
  holidays,
  termRange,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: CalendarGridProps) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days = useMemo(() => buildDays(year, month, events, holidays, termRange), [year, month, events, holidays, termRange]);

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));
  const goToday = () => onMonthChange(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          <button onClick={goToday} className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">Today</button>
        </div>
        <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((dayInfo, i) => {
          const isSelected = selectedDate && isSameDay(dayInfo.date, selectedDate);
          const visibleCount = Math.min(dayInfo.events.length + dayInfo.holidays.length, 3);
          const overflow = (dayInfo.events.length + dayInfo.holidays.length) - 3;
          return (
            <button
              key={i}
              onClick={() => onDateSelect(dayInfo.date)}
              className={cn(
                "relative h-[68px] flex flex-col items-center justify-start pt-1.5 border border-transparent rounded-lg transition-colors",
                dayInfo.isCurrentMonth && !dayInfo.isOutsideTerm ? "hover:bg-gray-50" : "cursor-default",
                isSelected && "bg-gray-50 border-gray-200",
              )}
            >
              <span
                className={cn(
                  "text-xs leading-none",
                  dayInfo.isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white font-semibold"
                    : dayInfo.isCurrentMonth
                      ? dayInfo.isOutsideTerm ? "text-gray-300" : "text-gray-700"
                      : "text-gray-300",
                )}
              >
                {dayInfo.day}
              </span>
              {(dayInfo.events.length > 0 || dayInfo.holidays.length > 0) && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-0.5">
                  {dayInfo.events.slice(0, visibleCount).map((e) => (
                    <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", TYPE_COLORS[e.type] ?? "bg-gray-300")} />
                  ))}
                  {dayInfo.holidays.slice(0, Math.max(0, visibleCount - dayInfo.events.length)).map((h) => (
                    <span key={h.id} className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  ))}
                  {overflow > 0 && (
                    <span className="text-[9px] text-gray-400 leading-none">+{overflow}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
