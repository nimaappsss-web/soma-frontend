import { useMemo } from "react";
import { useSchoolAttendanceToday } from "../api";
import { localDateKey } from "../../../utils/date";
import { DateInput } from "@/components/ui/date-input";
import { OfflineBanner } from "./OfflineBanner";
import { StatCards } from "./StatCards";
import { TopAttendance } from "./TopAttendance";
import { AbsenteePreview } from "./AbsenteePreview";
import { EmptyState } from "./EmptyState";

interface AttendanceTodayViewProps {
  date: string;
  onDateChange: (date: string) => void;
}

export const AttendanceTodayView = ({ date, onDateChange }: AttendanceTodayViewProps) => {
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceToday(date);

  const absentees = useMemo(
    () => data?.byClass?.flatMap((c) => c.absentees) ?? [],
    [data],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
        <div>
          <h2 className="text-lg font-semibold text-gray900">Today</h2>
          <p className="text-sm text-gray500">{localDateKey()}</p>
        </div>
        <DateInput
          value={date}
          onChange={onDateChange}
          label="Date"
          dropdownAlign="right"
          className="w-full sm:w-auto"
        />
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
          <div className="mt-4">
            <StatCards data={data} isLoading={isLoading} />
          </div>
          <TopAttendance classes={data?.byClass ?? []} isLoading={isLoading} />
          <AbsenteePreview absentees={absentees} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};
