import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useSchoolAttendanceSummary, useSchoolAttendanceRange } from "../api";
import { useClasses } from "../../principal/api/useClasses";
import { localDateKey, shiftDateKey } from "../../../utils/date";
import { DateInput } from "@/components/ui/date-input";
import { ClassFilter } from "./ClassFilter";
import { OfflineBanner } from "./OfflineBanner";
import { StatCards } from "./StatCards";
import { TopAttendance } from "./TopAttendance";
import { AbsenteePreview } from "./AbsenteePreview";
import { EmptyState } from "./EmptyState";
import { DayState } from "./DayState";

interface AttendanceTodayViewProps {
  date: string;
  onDateChange: (date: string) => void;
}

export const AttendanceTodayView = ({ date, onDateChange }: AttendanceTodayViewProps) => {
  const [classId, setClassId] = useState("");
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceSummary(date, classId || undefined);

  const { data: classesData } = useClasses();

  const from = shiftDateKey(date, -6);
  const { data: rangeData } = useSchoolAttendanceRange(from, date, classId || undefined);
  const sparklineData = useMemo(
    () => (rangeData?.days ?? []).map((d) => d.percentage),
    [rangeData],
  );

  const absentees = useMemo(() => data?.absentees ?? [], [data]);

  const unmarkedCount = useMemo(() => {
    if (classId || !data) return 0;
    const markedIds = new Set((data.byClass ?? []).filter((c) => c.present + c.absent > 0).map((c) => c.classId));
    return (classesData?.classes ?? []).filter((c) => !markedIds.has(c.id)).length;
  }, [data, classesData, classId]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
        <div>
          <h2 className="text-lg font-semibold text-gray900">Today</h2>
          <p className="text-sm text-gray500">
            {data?.dayOfWeek ? `${data.dayOfWeek} · ` : ""}
            {localDateKey()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <ClassFilter value={classId} onChange={setClassId} />
          <DateInput
            value={date}
            onChange={onDateChange}
            label="Date"
            dropdownAlign="right"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="mt-4">
        <OfflineBanner isStale={isStale} savedAt={savedAt} dataDate={data?.date} requestedDate={date} />
      </div>

      {isEmpty ? (
        <EmptyState
          loading={isLoading}
          error={error?.response?.data?.message ?? error?.message}
          onRetry={refetch}
        />
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
              {unmarkedCount > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber500/15">
                  <span className="h-2 w-2 rounded-full bg-amber500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray900">
                    {unmarkedCount} {unmarkedCount === 1 ? "class" : "classes"} not yet marked
                  </p>
                  <p className="text-xs text-gray500">Attendance hasn't been taken for these classes today.</p>
                </div>
              </div>
              <Link
                to="/admin/attendance/classes"
                className="shrink-0 text-xs font-medium text-gray700 hover:text-gray900 transition-colors"
              >
                View
              </Link>
            </div>
          )}
          <div className="mt-4">
            <StatCards data={data} isLoading={isLoading} sparklineData={sparklineData} />
          </div>
          <TopAttendance classes={data?.byClass ?? []} isLoading={isLoading} />
          <AbsenteePreview absentees={absentees} isLoading={isLoading} />
            </>
          )}
        </>
      )}
    </div>
  );
};
