import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "../../../components/ui/Avatar";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { AttendanceQueryResponse, AttendanceRecord as ApiAttendanceRecord } from "../types";
import type { Student as ApiStudent } from "../../students/types";

interface AttendanceHistoryViewProps {
  classId: string;
  formClass?: string;
}

const statusColors: Record<string, string> = {
  present: "text-green-600 bg-green-50",
  absent: "text-red-600 bg-red-50",
  late: "text-amber-600 bg-amber-50",
};

export const AttendanceHistoryView = ({ classId, formClass }: AttendanceHistoryViewProps) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  useQuery({
    queryKey: ["attendance", "history", classId, date],
    queryFn: async () => {
      const res = await fetchData<AttendanceQueryResponse>(
        `/attendance?classId=${classId}&date=${date}`,
        "GET",
      );
      if (res.records?.length) {
        const hasPending = await db.attendance
          .where("[userId+date+className]").equals([user!.id, date, formClass ?? ""])
          .filter((r) => r.syncStatus === "pending")
          .count();
        if (hasPending === 0) {
          await db.transaction("rw", db.attendance, async () => {
            await db.attendance
              .where("[userId+date+className]").equals([user!.id, date, formClass ?? ""])
              .delete();
            await db.attendance.bulkPut(
              (res.records as ApiAttendanceRecord[]).map((r) => ({
                id: r.id,
                userId: user!.id,
                studentId: r.studentId,
                className: formClass ?? "",
                schoolId: user?.schoolId ?? "",
                status: r.status,
                date,
                syncStatus: "synced" as const,
                createdAt: Date.now(),
              })),
            );
          });
        }
      }
      return res;
    },
    enabled: !!classId && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const records = useLiveQuery(
    () => {
      if (!user?.id) return Promise.resolve([] as import("../../../db/db").AttendanceRecord[]);
      return db.attendance.where("[userId+date+className]").equals([user.id, date, formClass ?? ""]).toArray();
    },
    [date, formClass, user?.id],
  );

  const studentIds = [...new Set((records ?? []).map((r) => r.studentId))];
  const cachedStudents = useLiveQuery(
    () => {
      if (!user?.id || studentIds.length === 0) return Promise.resolve([] as (import("../../../db/db").Student | undefined)[]);
      return db.students.where("[userId+classId]").equals([user.id, classId]).toArray();
    },
    [studentIds.join(","), user?.id, classId],
  );

  const studentMap = new Map<string, { name: string; admissionNo: string | null }>();
  for (const s of cachedStudents ?? []) {
    if (s) studentMap.set(s.id, { name: s.name, admissionNo: (s as any).admissionNo ?? null });
  }

  const missingIds = studentIds.filter((id) => !studentMap.has(id));

  useQuery({
    queryKey: ["students", "class", classId],
    queryFn: async () => {
      const res = await fetchData<{ students: ApiStudent[] }>(
        `/students?classId=${classId}&status=ACTIVE&limit=200`,
        "GET",
      );
      if (res.students?.length) {
        const userId = user!.id;
        await db.students.bulkPut(
          (res.students as ApiStudent[]).map((s) => ({ ...s, userId, createdAt: Date.now() }) as any),
        );
      }
      return res;
    },
    enabled: missingIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const sortedRecords = useMemo(() => {
    const map = new Map<string, { name: string; admissionNo: string | null }>();
    for (const s of cachedStudents ?? []) {
      if (s) map.set(s.id, { name: s.name, admissionNo: (s as any).admissionNo ?? null });
    }
    return [...(records ?? [])].sort((a, b) => {
      const na = map.get(a.studentId)?.name?.toLowerCase() ?? "";
      const nb = map.get(b.studentId)?.name?.toLowerCase() ?? "";
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  }, [records, cachedStudents]);

  if (records === undefined || cachedStudents === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (missingIds.length > 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
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
          {records.length} record(s)
        </span>
      </div>

      {!records.length ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No attendance records for {date}.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {sortedRecords.map((r) => {
            const s = studentMap.get(r.studentId);
            return (
              <div
                key={r.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={s?.name ?? r.studentId} size={28} />
                  <div>
                    <span className="text-gray-800 font-medium text-sm">
                      {s?.name ?? r.studentId}
                    </span>
                    {s?.admissionNo && (
                      <span className="ml-2 text-xs text-gray-400">{s.admissionNo}</span>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
