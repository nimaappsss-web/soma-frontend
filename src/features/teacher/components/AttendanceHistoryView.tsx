import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { Avatar } from "../../../components/ui/Avatar";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import type { AttendanceRecord } from "../types";

interface AttendanceHistoryViewProps {
  classId: string;
  formClass?: string;
  date?: string;
  onDateChange?: (date: string) => void;
}

type HistoryRecord = {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string | null;
  status: AttendanceRecord["status"];
  remarks: string | null;
  date: string;
};

const statusColors: Record<string, string> = {
  present: "text-green-600 bg-green-50",
  absent: "text-red-600 bg-red-50",
  late: "text-amber-600 bg-amber-50",
};

export const AttendanceHistoryView = ({ classId, formClass }: AttendanceHistoryViewProps) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    if (!classId || !date) return;
    const sub = liveQuery(async () => {
      let attendanceRecords = await db.attendance
        .where({ date })
        .toArray();
      if (user?.schoolId) {
        attendanceRecords = attendanceRecords.filter((r) => r.schoolId === user.schoolId);
      }
      if (formClass) {
        attendanceRecords = attendanceRecords.filter((r) => r.className === formClass);
      }
      const seen = new Set<string>();
      attendanceRecords = attendanceRecords.filter((r) => {
        if (seen.has(r.studentId)) return false;
        seen.add(r.studentId);
        return true;
      });
      const studentIds = [...new Set(attendanceRecords.map((r) => r.studentId))];
      const students = studentIds.length > 0
        ? await db.students.bulkGet(studentIds)
        : [];
      const studentMap = new Map(
        students.filter(Boolean).map((s) => [s!.id, { name: s!.name, admissionNo: (s as any).admissionNo ?? null }]),
      );
      return attendanceRecords
        .map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: studentMap.get(r.studentId)?.name ?? r.studentId,
          admissionNo: studentMap.get(r.studentId)?.admissionNo ?? null,
          status: r.status as AttendanceRecord["status"],
          remarks: null as string | null,
          date: r.date,
        }))
        .sort((a, b) => a.studentName.toLowerCase().localeCompare(b.studentName.toLowerCase()));
    }).subscribe({
      next: (data) => setRecords(data),
    });
    return () => sub.unsubscribe();
  }, [classId, date, user?.schoolId, formClass]);

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
          {records.length} record(s)
        </span>
      </div>

      {!records.length ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No attendance records for {date}.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {records.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar name={r.studentName} size={28} />
                <div>
                  <span className="text-gray-800 font-medium text-sm">
                    {r.studentName}
                  </span>
                  {r.admissionNo && (
                    <span className="ml-2 text-xs text-gray-400">{r.admissionNo}</span>
                  )}
                </div>
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

      {records.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs text-gray-400">
            {records.length} record(s)
          </span>
        </div>
      )}
    </div>
  );
};
