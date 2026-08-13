import type { DashboardStats } from "../types";

interface AttendanceCardProps {
  stats: Pick<DashboardStats, "attendance"> | undefined;
  isLoading: boolean;
}

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const AttendanceCard = ({ stats, isLoading }: AttendanceCardProps) => {
  const percentage = isLoading ? 0 : (stats?.attendance.today.percentage ?? 0);
  const present = isLoading ? 0 : (stats?.attendance.today.present ?? 0);
  const absent = isLoading ? 0 : (stats?.attendance.today.absent ?? 0);
  const total = present + absent;
  const offset = RING_CIRCUMFERENCE - (percentage / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="bg-white rounded-3xl border border-gray100 p-6 h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray900 mb-6">Attendance Overview</h3>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={RING_RADIUS} fill="none" stroke="#F3F4F6" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={RING_RADIUS}
              fill="none"
              stroke="#0D0D0D"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-gray900 leading-none">{isLoading ? "—" : `${percentage}%`}</span>
            <span className="text-xs text-gray500 mt-1">Today</span>
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
