import { Link } from "react-router";
import { ArrowRight, Crown, Medal, Ranking } from "iconsax-react";
import type { AttendanceSummaryByClass } from "../types";
import { ratePillClass } from "./StatCards";

interface TopAttendanceProps {
  classes: AttendanceSummaryByClass[];
  isLoading: boolean;
}

const pctOf = (c: AttendanceSummaryByClass) => (c.total > 0 ? Math.round((c.present / c.total) * 100) : 0);

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown variant="Bold" size={16} color="#FBBC05" />;
  if (rank === 2) return <Medal variant="Bold" size={16} color="#BBBBBB" />;
  if (rank === 3) return <Medal variant="Bold" size={16} color="#FB923C" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray50 text-[11px] font-semibold text-gray500">
      {rank}
    </span>
  );
};

export const TopAttendance = ({ classes, isLoading }: TopAttendanceProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-5 mt-4">
        <div className="h-4 w-28 animate-pulse bg-gray50 rounded mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse bg-gray50 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  if (classes.length === 0) return null;

  const ranked = [...classes]
    .filter((c) => c.total > 0 && c.present + c.absent > 0)
    .sort((a, b) => pctOf(b) - pctOf(a));

  if (ranked.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray100 p-5 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Ranking variant="Bold" size={16} color="#0D0D0D" />
          <h3 className="text-sm font-semibold text-gray900">Top Attendance</h3>
        </div>
        <Link
          to="/admin/attendance/classes"
          className="flex items-center gap-1 text-xs font-medium text-gray500 hover:text-gray700 transition-colors"
        >
          See all
          <ArrowRight variant="Linear" size={14} color="#0D0D0D" />
        </Link>
      </div>

      <div className="divide-y divide-gray50">
        {ranked.slice(0, 5).map((c, i) => {
          const pct = pctOf(c);
          return (
            <div key={c.classId} className="flex items-center gap-3 py-2.5">
              <RankIcon rank={i + 1} />
              <span className="text-sm text-gray700 truncate min-w-0 flex-1">{c.className}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ratePillClass(pct)}`}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
