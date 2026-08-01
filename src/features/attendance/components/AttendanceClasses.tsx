import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft2, ArrowRight } from "iconsax-react";
import { useSchoolAttendanceToday } from "../api";
import { localDateKey } from "../../../utils/date";
import { DateInput } from "@/components/ui/date-input";
import { OfflineBanner } from "./OfflineBanner";
import { StatCards } from "./StatCards";
import { EmptyState } from "./EmptyState";

const pctOf = (c: { total: number; present: number }) =>
  c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;

export const AttendanceClasses = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(localDateKey());
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceToday(date);

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center rounded-full border border-gray100 text-gray700 hover:bg-gray50 transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft2 variant="Bold" size={16} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray900">Class Breakdown</h1>
            <p className="text-xs md:text-sm text-gray500 mt-0.5">Attendance rate by class</p>
          </div>
        </div>
        <DateInput value={date} onChange={setDate} label="Date" dropdownAlign="right" className="w-full sm:w-auto" />
      </div>

      <div className="mt-4">
        <OfflineBanner isStale={isStale} savedAt={savedAt} dataDate={data?.date} requestedDate={date} />
      </div>

      {isEmpty ? (
        <div className="mt-4">
          <EmptyState loading={isLoading} error={error?.response?.data?.message ?? error?.message} onRetry={refetch} />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <StatCards data={data} isLoading={isLoading} />
          </div>

          <div className="mt-4 space-y-3">
            {[...(data?.byClass ?? [])]
              .sort((a, b) => pctOf(b) - pctOf(a))
              .filter((c) => c.total > 0)
              .map((c) => {
                const pct = pctOf(c);
                const barColor =
                  pct >= 80 ? "bg-springgreen600" : pct >= 50 ? "bg-amber500" : "bg-red500";
                return (
                <div key={c.classId} className="bg-white rounded-xl border border-gray100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray900 truncate">{c.className}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gray900">{pct}%</span>
                      <Link
                        to={`/admin/attendance/absentees?date=${date}`}
                        className="flex items-center gap-0.5 text-xs font-medium text-gray500 hover:text-gray700 transition-colors"
                      >
                        View
                        <ArrowRight variant="Bold" size={14} className="text-gray300" />
                      </Link>
                    </div>
                  </div>

                  <div className="h-2 bg-gray100 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray300" />
                      {c.total} enrolled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-springgreen600" />
                      {c.present} present
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red500" />
                      {c.absent} absent
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
