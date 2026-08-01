import { useState } from "react";
import { cn } from "@/lib/utils";
import { localDateKey } from "../../../utils/date";
import { AttendanceTodayView } from "./AttendanceTodayView";
import { AttendanceCalendarView } from "./AttendanceCalendarView";

type Tab = "today" | "calendar";

const now = new Date();
const today = localDateKey(now);

export const AttendanceOverview = () => {
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState<string>(today);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "today", label: "Today" },
    { key: "calendar", label: "Calendar" },
  ];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Attendance</h1>
          <p className="text-xs md:text-sm text-gray500 mt-1">Whole-school attendance across all classes</p>
        </div>
        <div className="flex items-center gap-1 bg-gray50 rounded-full p-1 self-stretch sm:self-start">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm font-medium rounded-full transition-colors active:scale-95",
                tab === t.key ? "bg-white text-gray900 shadow-sm" : "text-gray500 hover:text-gray700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "today" ? (
        <AttendanceTodayView date={date} onDateChange={setDate} />
      ) : (
        <AttendanceCalendarView month={month} year={year} onMonthChange={handleMonthChange} />
      )}
    </div>
  );
};
