import { Link } from "react-router";
import { ArrowRight } from "iconsax-react";
import type { AttendanceSummaryAbsentee } from "../types";

interface AbsenteePreviewProps {
  absentees: AttendanceSummaryAbsentee[];
  isLoading: boolean;
}

const PREVIEW_COUNT = 4;

export const AbsenteePreview = ({ absentees, isLoading }: AbsenteePreviewProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-5 mt-4">
        <div className="h-4 w-24 animate-pulse bg-gray50 rounded mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse bg-gray50 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  if (absentees.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray100 p-5 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray900">Absentees</h3>
          <span className="text-xs text-gray500 font-medium">{absentees.length}</span>
        </div>
        <Link
          to="/admin/attendance/absentees"
          className="flex items-center gap-1 text-xs font-medium text-gray500 hover:text-gray700 transition-colors"
        >
          See all
          <ArrowRight variant="Linear" size={14} color="#0D0D0D" />
        </Link>
      </div>

      <div className="divide-y divide-gray50">
        {absentees.slice(0, PREVIEW_COUNT).map((a) => (
          <div key={a.studentId} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray900 truncate">{a.studentName}</p>
              <p className="text-xs text-gray500 truncate">{a.admissionNo}</p>
            </div>
            <span className="text-xs text-gray500 shrink-0 truncate max-w-[120px]">
              {a.parentName || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
