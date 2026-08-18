import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "../../../components/ui/Avatar";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { DateInput } from "../../../components/ui/date-input";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { localDateKey } from "../../../utils/date";
import type { AttendanceQueryResponse, AttendanceRecord as ApiAttendanceRecord, AttendanceReason } from "../types";
import type { Student as ApiStudent } from "../../students/types";

interface AttendanceHistoryViewProps {
  classId: string;
  formClass?: string;
}

const statusColors: Record<string, string> = {
  present: "text-green-600 bg-green-50",
  absent: "text-red-600 bg-red-50",
};

export const AttendanceHistoryView = ({ classId, formClass }: AttendanceHistoryViewProps) => {
  const { user } = useAuth();
  const today = localDateKey();
  const [date, setDate] = useState(today);
  const [blockedReason, setBlockedReason] = useState<AttendanceReason | null>(null);

  const historyQuery = useQuery({
    queryKey: ["attendance", "history", classId, date],
    queryFn: async () => {
      const res = await fetchData<AttendanceQueryResponse>(
        `/attendance?classId=${classId}&date=${date}`,
        "GET",
      );
      setBlockedReason(res.reason && res.reason.available === false ? res.reason : null);
      try {
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
      } catch (err) {
        console.warn("Attendance history cache write failed:", err);
      }
      return res;
    },
    enabled: !!classId && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const liveRecords = useLiveQuery(
    () => {
      if (!user?.id) return Promise.resolve([] as import("../../../db/db").AttendanceRecord[]);
      return db.attendance.where("[userId+date+className]").equals([user.id, date, formClass ?? ""]).toArray();
    },
    [date, formClass, user?.id],
  );

  const dayNote = useLiveQuery(
    () => {
      if (!user?.id) return Promise.resolve(undefined as import("../../../db/db").AttendanceNote | undefined);
      return db.attendanceNotes.where("[userId+date+className]").equals([user.id, date, formClass ?? ""]).first();
    },
    [date, formClass, user?.id],
  );

  const apiRecords = useMemo(() => {
    const recs = historyQuery.data?.records ?? [];
    if (liveRecords === undefined && recs.length) return recs;
    if (liveRecords === undefined) return recs;
    return undefined;
  }, [historyQuery.data, liveRecords]);

  const records = liveRecords !== undefined ? liveRecords : (apiRecords as ApiAttendanceRecord[] | undefined);

  const studentIds = [...new Set((records ?? []).map((r) => r.studentId))];
  const cachedStudents = useLiveQuery(
    () => {
      if (!user?.id) return Promise.resolve([] as import("../../../db/db").Student[]);
      return db.students.where("userId").equals(user.id).toArray();
    },
    [user?.id],
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
      try {
        if (res.students?.length) {
          const userId = user!.id;
          await db.students.bulkPut(
            (res.students as ApiStudent[]).map((s) => ({ ...s, userId, createdAt: Date.now() }) as any),
          );
        }
      } catch (err) {
        console.warn("Student roster cache write failed:", err);
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

  if (records === undefined && historyQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SomaLoader label="Loading attendance" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <DateInput
          value={date}
          onChange={(v) => { setDate(v); setBlockedReason(null); }}
          className="h-10"
        />
        <span className="text-xs text-gray-400">
          {(records ?? []).length} record(s)
        </span>
      </div>

      {dayNote?.note && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Note for {date}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dayNote.note}</p>
        </div>
      )}

      {!records?.length ? (
        blockedReason ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500 mb-1">
              {blockedReason.type === "HOLIDAY"
                ? "Holiday"
                : blockedReason.type === "WEEKEND"
                  ? "Weekend"
                  : blockedReason.type === "OUT_OF_TERM"
                    ? "Outside the academic term"
                    : blockedReason.type === "FUTURE"
                      ? "Future date"
                      : "Not a school day"}
            </p>
            <p className="text-xs text-gray-400">{blockedReason.message ?? "No school on this day."}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No attendance records for {date}.
          </p>
        )
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
                  <Avatar name={s?.name ?? "Unknown student"} size={28} />
                  <div>
                    <span className="text-gray-800 font-medium text-sm">
                      {s?.name ?? "Unknown student"}
                    </span>
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
