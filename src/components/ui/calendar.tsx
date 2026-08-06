import { useState, useRef, useEffect } from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  value?: string;
  onChange?: (date: string) => void;
  onClose?: () => void;
  min?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const Calendar = ({ value, onChange, onClose, min }: CalendarProps) => {
  const today = new Date();
  const selected = value ? new Date(value) : null;

  const [viewDate] = useState(selected || today);
  const [viewMonth, setViewMonth] = useState(viewDate.getMonth());
  const [viewYear, setViewYear] = useState(viewDate.getFullYear());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [yearPageStart, setYearPageStart] = useState(() => {
    const y = viewDate.getFullYear();
    return Math.floor(y / 12) * 12;
  });

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (min && iso < min) return;
    onChange?.(iso);
    onClose?.();
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewMonth &&
      selected.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const prevYearPage = () => setYearPageStart((p) => p - 12);
  const nextYearPage = () => setYearPageStart((p) => p + 12);

  const selectYear = (year: number) => {
    setViewYear(year);
    setViewMode("month");
  };

  const yearCells = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-gray200 shadow-lg p-4 w-[280px]">
      <div className="flex items-center justify-between mb-4">
        {viewMode === "month" ? (
          <>
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray50 rounded-lg transition-colors">
              <ArrowLeft2 variant="Linear" size={16} color="#6B7280" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("year")}
              className="text-sm font-medium text-gray900 hover:bg-gray50 px-2 py-0.5 rounded-lg transition-colors"
            >
              {MONTHS[viewMonth]} {viewYear}
            </button>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray50 rounded-lg transition-colors">
              <ArrowRight2 variant="Linear" size={16} color="#6B7280" />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={prevYearPage} className="p-1 hover:bg-gray50 rounded-lg transition-colors">
              <ArrowLeft2 variant="Linear" size={16} color="#6B7280" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className="text-sm font-medium text-gray900 hover:bg-gray50 px-2 py-0.5 rounded-lg transition-colors"
            >
              {yearPageStart}–{yearPageStart + 11}
            </button>
            <button type="button" onClick={nextYearPage} className="p-1 hover:bg-gray50 rounded-lg transition-colors">
              <ArrowRight2 variant="Linear" size={16} color="#6B7280" />
            </button>
          </>
        )}
      </div>

      {viewMode === "year" ? (
        <div className="grid grid-cols-3 gap-1">
          {yearCells.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => selectYear(year)}
              className={cn(
                "h-9 rounded-lg text-sm flex items-center justify-center transition-colors",
                year === viewYear && "bg-gray900 text-white font-medium",
                year !== viewYear && year === today.getFullYear() && "bg-gray100 text-gray900 font-medium",
                year !== viewYear && year !== today.getFullYear() && "text-gray700 hover:bg-gray50",
              )}
            >
              {year}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs text-gray400 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isDisabled = !!min && iso < min;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors",
                    isSelected(day) && "bg-gray900 text-white font-medium",
                    !isSelected(day) && isToday(day) && "bg-gray100 text-gray900 font-medium",
                    !isSelected(day) && !isToday(day) && "text-gray700 hover:bg-gray50",
                    isDisabled && "opacity-30 pointer-events-none",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
