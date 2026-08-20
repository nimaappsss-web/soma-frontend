import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft2, ArrowRight } from "iconsax-react";
import { useSchoolAttendanceSummary, useSchoolAttendanceRange } from "../api";
import { useClasses } from "../../principal/api/useClasses";
import { localDateKey, shiftDateKey } from "../../../utils/date";
import { DateInput } from "@/components/ui/date-input";
import { OfflineBanner } from "./OfflineBanner";
import { StatCards } from "./StatCards";
import { EmptyState } from "./EmptyState";
import { DayState } from "./DayState";
const pctOf = (c: { total: number; present: number }) =>
  c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
export const AttendanceClasses = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(localDateKey());
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceSummary(date);
  const { data: classesData } = useClasses();
  const from = shiftDateKey(date, -6);
  const { data: rangeData } = useSchoolAttendanceRange(from, date);
  const sparklineData = (rangeData?.days ?? []).map((d) => d.percentage);
  const marked = useMemo(
    () => (data?.byClass ?? []).filter((c) => c.total > 0 && c.present + c.absent > 0),
    [data],
  );
  const unmarked = useMemo(() => {
    const markedIds = new Set(marked.map((c) => c.classId));
    return (classesData?.classes ?? []).filter((c) => !markedIds.has(c.id));
  }, [classesData, marked]);
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
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
          {data?.isWeekend || data?.isHoliday ? (
            <DayState
              type={data.isHoliday ? "holiday" : "weekend"}
              dayOfWeek={data.dayOfWeek}
              date={date}
            />
          ) : (
            <>
              <div className="mt-4">
                <StatCards data={data} isLoading={isLoading} sparklineData={sparklineData} />
              </div>
          <div className="mt-4 space-y-3">
            {[...marked]
              .sort((a, b) => pctOf(b) - pctOf(a))
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
                        <ArrowRight variant="Linear" size={14} color="#0D0D0D" />
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
          {unmarked.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray900">Not yet marked</h3>
                <span className="text-xs text-gray500 font-medium">{unmarked.length}</span>
              </div>
              <div className="bg-white rounded-xl border border-gray100 divide-y divide-gray50">
                {unmarked.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray700 truncate">{c.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-amber500 bg-amber500/10 rounded-full px-2.5 py-1">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}
    </div>
  );
};
