import { cn } from "@/lib/utils";
import { parseLocalDate } from "../../../utils/date";
import type { AnalyticsCalendarDay } from "../types";

interface DayDetailPanelProps {
  day?: AnalyticsCalendarDay;
  plain?: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DayDetailPanel = ({ day, plain = false }: DayDetailPanelProps) => {
  const wrapper = plain
    ? "h-full"
    : "bg-white rounded-xl border border-gray100 p-5 h-full";

  if (!day) {
    return (
      <div className={wrapper}>
        <p className="text-xs text-gray500">Select a day to view its attendance.</p>
      </div>
    );
  }

  const dateObj = parseLocalDate(day.date);
  const weekday = dateObj ? DAY_NAMES[dateObj.getDay()] : day.dayOfWeek;

  if (!day.isSchoolDay) {
    return (
      <div className={wrapper}>
        <p className="text-sm font-semibold text-gray900">{day.date}</p>
        <p className="text-xs text-gray500 mt-0.5">{weekday}</p>
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-amber500/10 text-amber500 px-2.5 py-1 text-xs font-medium">
            {day.isHoliday ? "Holiday" : "Not a school day"}
          </span>
          <p className="text-xs text-gray500 mt-3">No attendance recorded on this day.</p>
        </div>
      </div>
    );
  }

  const pctColor = day.percentage >= 80 ? "text-springgreen600" : day.percentage >= 50 ? "text-amber500" : "text-red500";

  return (
    <div className={wrapper}>
      <div className={cn(!plain && "text-left")}>
        <p className="text-sm font-semibold text-gray900">{day.date}</p>
        <p className="text-xs text-gray500 mt-0.5">{weekday}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl bg-gray50 p-3">
          <p className="text-xs text-gray500">Present</p>
          <p className="text-lg font-bold text-springgreen600 mt-0.5">{day.present}</p>
        </div>
        <div className="rounded-xl bg-gray50 p-3">
          <p className="text-xs text-gray500">Absent</p>
          <p className="text-lg font-bold text-red500 mt-0.5">{day.absent}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray500">Attendance rate</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-2xl font-bold ${pctColor}`}>{day.percentage}%</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray100 mt-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              day.percentage >= 80 ? "bg-springgreen600" : day.percentage >= 50 ? "bg-amber500" : "bg-red500",
            )}
            style={{ width: `${Math.min(100, day.percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
