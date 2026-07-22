import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { AttendanceRecord } from "../../../db/db";
import type { AttendanceQueryResponse, AttendanceRecord as ApiAttendanceRecord } from "../types";

export const useAttendance = ({ classId, date }: { classId: string; date: string }) => {
  const { user } = useAuth();

  const cached = useLiveQuery(
    () => {
      if (!classId || !date || !user?.id) return Promise.resolve([] as AttendanceRecord[]);
      return db.attendance
        .where("[userId+date+className]").equals([user.id, date, user?.formClass ?? ""])
        .toArray();
    },
    [classId, date, user?.id, user?.formClass],
  );

  const query = useQuery({
    queryKey: ["attendance", classId, date],
    queryFn: async () => {
      const res = await fetchData<AttendanceQueryResponse>(
        `/attendance?classId=${classId}&date=${date}`,
        "GET",
      );
      if (res.records?.length) {
        const hasPending = await db.attendance
          .where("[userId+date+className]").equals([user!.id, date, user?.formClass ?? ""])
          .filter((r) => r.syncStatus === "pending")
          .count();
        if (hasPending === 0) {
          await db.transaction("rw", db.attendance, async () => {
            await db.attendance
              .where("[userId+date+className]").equals([user!.id, date, user?.formClass ?? ""])
              .delete();
            await db.attendance.bulkPut(
              (res.records as ApiAttendanceRecord[]).map((r) => ({
                id: r.id,
                userId: user!.id,
                studentId: r.studentId,
                className: user?.formClass ?? "",
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

  const mapped = cached
    ? {
        records: cached.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          status: r.status,
          date: r.date,
          classId,
        })) as AttendanceQueryResponse["records"],
        total: cached.length,
        page: 1,
        totalPages: 1,
      }
    : undefined;

  return {
    data: cached && cached.length > 0 ? mapped : (query.data ?? undefined),
    isLoading: (cached === undefined || (cached.length === 0 && query.isLoading)),
    error: query.error ?? undefined,
  };
};
