import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type AttendanceRecord } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { localDateKey, parseLocalDate } from "../../../utils/date";

interface ParentAttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late";
  updatedAt: string;
}

interface ParentAttendanceResponse {
  records: ParentAttendanceRecord[];
  total: number;
}

const dateStr = (d: Date | string) => {
  const parsed = typeof d === "string" ? parseLocalDate(d) : d;
  return parsed ? localDateKey(parsed) : "";
};

/**
 * Fetches attendance for the parent's children and caches it into
 * `db.attendance` under the parent's userId so existing cache reads work.
 */
export const useParentAttendance = ({ days = 30 }: { days?: number } = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const from = localDateKey(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const to = localDateKey(new Date());

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as AttendanceRecord[]);
      return db.attendance.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<ParentAttendanceResponse>({
    queryKey: ["parentAttendance", userId, from, to],
    queryFn: async () => {
      const res = await fetchData<ParentAttendanceResponse>(
        `/parents/me/attendance?from=${from}&to=${to}`,
        "GET",
      );
      await db.transaction("rw", db.attendance, async () => {
        await db.attendance.where("userId").equals(userId).delete();
        if (res.records?.length) {
          await db.attendance.bulkPut(
            res.records.map((r: ParentAttendanceRecord) => ({
              id: r.id,
              userId,
              studentId: r.studentId,
              className: "",
              schoolId: user?.schoolId ?? "",
              status: r.status,
              date: dateStr(r.date),
              syncStatus: "synced" as const,
              createdAt: Date.now(),
            })),
          );
        }
      });
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isEmpty = (cached ?? []).length === 0;

  return {
    records: cached !== undefined ? cached : [],
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
    refetch: () => query.refetch(),
  };
};
