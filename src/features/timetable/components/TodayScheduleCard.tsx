import { Link } from "react-router";
import { CalendarTick } from "iconsax-react";

import type { TimetableEntry } from "../types";
import { entriesForToday } from "../utils/todaySchedule";

interface TodayScheduleCardProps {
  entries: TimetableEntry[];
  isLoading?: boolean;
}

/** Black rounded card showing today's lessons for the teacher dashboard. */
export const TodayScheduleCard = ({ entries, isLoading }: TodayScheduleCardProps) => {
  const today = entriesForToday(entries);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl bg-gray900 p-5 text-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Today&apos;s schedule</h3>
          <p className="text-xs text-white/50">{dateLabel}</p>
        </div>
        <Link
          to="/teach/timetable"
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/20"
        >
          Full week →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>
      ) : today.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-4">
          <CalendarTick size={18} color="#FFFFFF" opacity={0.7} />
          <p className="text-sm text-white/70">No classes scheduled today.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {today.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
              <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-black/20 py-1 text-center">
                <span className="text-[10px] font-semibold leading-tight tabular-nums">{e.startTime}</span>
                <span className="text-[9px] leading-tight tabular-nums text-white/50">{e.endTime}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.subjectName || "Subject"}</p>
                <p className="truncate text-xs text-white/60">{e.className}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
