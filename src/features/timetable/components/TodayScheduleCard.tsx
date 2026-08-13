import { Link } from "react-router";
import { CalendarTick } from "iconsax-react";

import type { TimetableEntry } from "../types";
import { entriesForToday, to12Hour } from "../utils/todaySchedule";

interface TodayScheduleCardProps {
  entries: TimetableEntry[];
  isLoading?: boolean;
}

/** "Today's schedule" block for the teacher dashboard — up to 3 clickable
 * lessons with 12-hour times, shown inside the dashboard's white card. */
export const TodayScheduleCard = ({ entries, isLoading }: TodayScheduleCardProps) => {
  const today = entriesForToday(entries);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const visible = today.slice(0, 3);

  return (
    <div className="mt-5 border-t border-gray100 pt-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray900">Today&apos;s schedule</h3>
          <p className="text-xs text-gray500">{dateLabel}</p>
        </div>
        <Link
          to="/teach/timetable"
          className="shrink-0 rounded-full bg-offWhite px-3 py-1 text-[11px] font-medium text-gray900 transition-colors hover:bg-gray100"
        >
          Full week →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-gray50" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-offWhite px-4 py-4">
          <CalendarTick size={18} color="#8C8C8C" />
          <p className="text-sm text-gray500">No classes scheduled today.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((e) => (
            <li key={e.id}>
              <Link
                to="/teach/timetable"
                className="flex items-center gap-3 rounded-xl bg-offWhite px-3 py-2.5 transition-colors hover:bg-gray100"
              >
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-white py-1 text-center">
                  <span className="text-[11px] font-semibold leading-tight tabular-nums text-gray900">
                    {to12Hour(e.startTime)}
                  </span>
                  <span className="text-[10px] leading-tight tabular-nums text-gray500">
                    {to12Hour(e.endTime)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray900">{e.subjectName || "Subject"}</p>
                  <p className="truncate text-xs text-gray500">{e.className}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {today.length > 3 && (
        <p className="mt-3 text-xs text-gray500">
          +{today.length - 3} more today — see your{" "}
          <Link to="/teach/timetable" className="font-medium text-azure500 hover:underline">
            full timetable
          </Link>
          .
        </p>
      )}
    </div>
  );
};
