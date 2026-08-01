import { Calendar, Cake } from "iconsax-react";

interface DayStateProps {
  type: "weekend" | "holiday";
  dayOfWeek?: string;
  date?: string;
}

export const DayState = ({ type, dayOfWeek, date }: DayStateProps) => {
  const isHoliday = type === "holiday";

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
          isHoliday ? "bg-amber500/10" : "bg-gray900/5"
        }`}
      >
        {isHoliday ? (
          <Cake size={24} variant="Bold" color="#F59E0B" />
        ) : (
          <Calendar size={24} variant="Bold" color="#0D0D0D" />
        )}
      </div>
      <p className="text-base font-semibold text-gray900">{isHoliday ? "Holiday" : "Weekend"}</p>
      <p className="text-sm text-gray500 mt-1">
        {dayOfWeek ?? date ?? "This day"} {isHoliday ? "is a school holiday." : "is a weekend — no school."}
      </p>
    </div>
  );
};
