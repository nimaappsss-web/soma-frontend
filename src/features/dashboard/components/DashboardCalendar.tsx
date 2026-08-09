import { useState } from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const DashboardCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray900">{monthLabel} {currentYear}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray50 transition-colors"
          >
            <ArrowLeft2 size={14} color="#8C8C8C" />
          </button>
          <button
            onClick={goToNext}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray50 transition-colors"
          >
            <ArrowRight2 size={14} color="#8C8C8C" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray400 py-1.5">
            {d}
          </div>
        ))}
        {blanks.map((b) => (
          <div key={`b${b}`} />
        ))}
        {days.map((day) => (
          <div
            key={day}
            className={`text-center text-xs py-1.5 rounded-full ${
              isToday(day)
                ? "bg-gray900 text-white font-semibold"
                : "text-gray700 hover:bg-gray50"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};
