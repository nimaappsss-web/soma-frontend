import { useMemo, useState } from "react";
import { useSchoolAttendanceCalendar } from "../api";
import { localDateKey } from "../../../utils/date";
import { BottomSheet } from "../../../components/mobile/BottomSheet";
import { ClassFilter } from "./ClassFilter";
import { OfflineBanner } from "./OfflineBanner";
import { SchoolCalendar } from "./SchoolCalendar";
import { DayDetailPanel } from "./DayDetailPanel";
import { EmptyState } from "./EmptyState";

interface AttendanceCalendarViewProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

export const AttendanceCalendarView = ({ month, year, onMonthChange }: AttendanceCalendarViewProps) => {
  const [classId, setClassId] = useState("");
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceCalendar(month, year, classId || undefined);

  const [selected, setSelected] = useState<string>(localDateKey());
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedDay = useMemo(
    () => data?.days.find((d) => d.date === selected),
    [data, selected],
  );

  const handleSelect = (date: string) => {
    setSelected(date);
    setSheetOpen(true);
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <OfflineBanner
          isStale={isStale}
          savedAt={savedAt}
          dataDate={
            data ? `${data.year}-${String(data.month).padStart(2, "0")}` : undefined
          }
          requestedDate={`${year}-${String(month).padStart(2, "0")}`}
        />
        <ClassFilter value={classId} onChange={setClassId} />
      </div>

      {isEmpty ? (
        <EmptyState loading={isLoading} error={error?.response?.data?.message ?? error?.message} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SchoolCalendar
                analytics={data}
                month={month}
                year={year}
                selectedDate={selected}
                onDateSelect={handleSelect}
                onMonthChange={onMonthChange}
              />
            </div>
            <div className="hidden lg:block">
              <DayDetailPanel day={selectedDay} />
            </div>
          </div>

          {/* Mobile: day detail as bottom sheet */}
          <div className="lg:hidden">
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
              <DayDetailPanel day={selectedDay} plain />
            </BottomSheet>
          </div>
        </>
      )}
    </div>
  );
};
