import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft2, Call, Sms } from "iconsax-react";
import { useSchoolAttendanceToday } from "../api";
import { localDateKey } from "../../../utils/date";
import { DateInput } from "@/components/ui/date-input";
import { ClassFilter } from "./ClassFilter";
import { OfflineBanner } from "./OfflineBanner";
import { EmptyState } from "./EmptyState";
export const AttendanceAbsentees = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<string>(searchParams.get("date") ?? localDateKey());
  const [classId, setClassId] = useState("");
  const { data, savedAt, isLoading, isStale, isEmpty, error, refetch } =
    useSchoolAttendanceToday(date, classId || undefined);
  const absentees = useMemo(
    () => data?.byClass?.flatMap((c) => c.absentees) ?? [],
    [data],
  );
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center rounded-full border border-gray100 text-gray700 hover:bg-gray50 transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#242425" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray900">Absentees</h1>
            <p className="text-xs md:text-sm text-gray500 mt-0.5">
              {data?.date ?? date} · {absentees.length} students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ClassFilter value={classId} onChange={setClassId} />
          <DateInput value={date} onChange={setDate} label="Date" dropdownAlign="right" className="w-full sm:w-auto" />
        </div>
      </div>
      <div className="mt-4">
        <OfflineBanner isStale={isStale} savedAt={savedAt} dataDate={data?.date} requestedDate={date} />
      </div>
      {isEmpty ? (
        <div className="mt-4">
          <EmptyState loading={isLoading} error={error?.response?.data?.message ?? error?.message} onRetry={refetch} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {absentees.length === 0 && (
            <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
              <p className="text-sm font-medium text-gray900">No absentees</p>
              <p className="text-xs text-gray500 mt-1">Every student was present on this day.</p>
            </div>
          )}
          {absentees.map((a) => (
            <div key={a.studentId} className="bg-white rounded-xl border border-gray100 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray900 truncate">{a.studentName}</p>
                  <p className="text-xs text-gray500 mt-0.5">
                    {a.admissionNo} · {a.teacherName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${a.parentPhone}`}
                    className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-gray50 active:bg-gray100 hover:bg-gray100 text-gray700 transition-colors"
                    aria-label={`Call ${a.parentName}`}
                  >
                    <Call size={18} className="md:hidden" variant="Bold" color="#4285F4" />
                    <Call size={14} className="hidden md:block" variant="Bold" color="#4285F4" />
                  </a>
                  <a
                    href={`mailto:${a.parentEmail}`}
                    className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-gray50 active:bg-gray100 hover:bg-gray100 text-gray700 transition-colors"
                    aria-label={`Email ${a.parentName}`}
                  >
                    <Sms size={18} className="md:hidden" variant="Bold" color="#4285F4" />
                    <Sms size={14} className="hidden md:block" variant="Bold" color="#4285F4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray50">
                <div>
                  <p className="text-[11px] text-gray500">Parent</p>
                  <p className="text-sm font-medium text-gray900">{a.parentName || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray500">Phone</p>
                  <a href={`tel:${a.parentPhone}`} className="text-sm font-medium text-azure500">
                    {a.parentPhone || "—"}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
