import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useAttendance } from "../api";
import { db } from "../../../db/db";

interface AttendanceHistoryViewProps {
  classId: string;
  formClass: string;
}

const statusColors: Record<string, string> = {
  present: "text-green-600 bg-green-50",
  absent: "text-red-600 bg-red-50",
  late: "text-amber-600 bg-amber-50",
};

export const AttendanceHistoryView = ({ classId, formClass }: AttendanceHistoryViewProps) => {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const { data, isLoading } = useAttendance({ classId, date });

  const students = useLiveQuery(
    () => db.students.where("classId").equals(classId).toArray(),
    [classId],
  );

  const studentMap = new Map(students?.map((s) => [s.id, s.name]) ?? []);

  if (isLoading) {
    return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm"
        />
        <span className="text-xs text-gray-400">
          {data?.total ?? 0} record(s)
        </span>
      </div>

      {!data?.records.length ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No attendance records for {date}.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {data.records.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <span className="text-gray-800 font-medium text-sm">
                  {r.studentName ?? studentMap.get(r.studentId) ?? r.studentId}
                </span>
                {r.admissionNo && (
                  <span className="ml-2 text-xs text-gray-400">{r.admissionNo}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    statusColors[r.status] ?? "text-gray-600 bg-gray-50"
                  }`}
                >
                  {r.status}
                </span>
                {r.remarks && (
                  <span className="text-xs text-gray-400 italic">{r.remarks}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
        </div>
      )}
    </div>
  );
};
