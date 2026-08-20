import type { DashboardStats } from "../types";

interface AttendanceCardProps {
  stats: Pick<DashboardStats, "attendance"> | undefined;
  isLoading: boolean;
}

const RING_RADIUS = 94;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const AttendanceCard = ({ stats, isLoading }: AttendanceCardProps) => {
  const hasData = !isLoading && !!stats;
  const percentage = hasData ? (stats?.attendance.today.percentage ?? 0) : 0;
  const present = hasData ? (stats?.attendance.today.present ?? 0) : 0;
  const absent = hasData ? (stats?.attendance.today.absent ?? 0) : 0;
  const total = present + absent;
  const offset = RING_CIRCUMFERENCE - (percentage / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="bg-white rounded-3xl border border-gray100 p-6 h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray900 mb-6">Attendance Overview</h3>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg viewBox="0 0 220 220" className="w-[180px] h-[180px] lg:w-[220px] lg:h-[220px]">
            <circle cx="110" cy="110" r={RING_RADIUS} fill="none" stroke="#F3F4F6" strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="#0D0D0D"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 110 110)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[38px] font-bold text-gray900 leading-none">{isLoading || !hasData ? "—" : `${percentage.toFixed(1)}%`}</span>
            <span className="text-sm text-gray500 mt-1">Today</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray900" />
          <span className="text-sm text-gray500">Present <span className="font-medium text-gray900">{present}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray200" />
          <span className="text-sm text-gray500">Absent <span className="font-medium text-gray900">{absent}</span></span>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray500">Total students</span>
            <span className="font-medium text-gray900">{total}</span>
          </div>
        </div>
      )}
    </div>
  );
};
