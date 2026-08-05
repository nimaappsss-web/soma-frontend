import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type { StudentMonthlyAttendance } from "../types";

export const useStudentMonthlyAttendance = ({
  studentId,
  month,
  year,
}: {
  studentId: string;
  month: number;
  year: number;
}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cacheKey = `${userId}-${studentId}-${month}-${year}`;

  const cached = useLiveQuery(
    async () => {
      if (!userId || !studentId) return undefined;
      const record = await db.studentMonthlyAttendance
        .where("id")
        .equals(cacheKey)
        .first();
      if (!record) return undefined;
      try {
        return JSON.parse(record.dataJson) as StudentMonthlyAttendance;
      } catch {
        return undefined;
      }
    },
    [cacheKey, userId, studentId],
  );

  const query = useQuery<StudentMonthlyAttendance, Error>({
    queryKey: ["studentMonthlyAttendance", studentId, month, year],
    queryFn: async () => {
      const url = `/students/${studentId}/attendance/monthly?month=${month}&year=${year}`;
      const res = await fetchData<StudentMonthlyAttendance>(url, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) =>
            i.table === "studentMonthlyAttendance" &&
            i.status === "pending",
        )
        .count();

      await db.transaction("rw", db.studentMonthlyAttendance, async () => {
        if (hasPending === 0) {
          await db.studentMonthlyAttendance
            .where("id")
            .equals(cacheKey)
            .delete();
        }
        if (res) {
          await db.studentMonthlyAttendance.put({
            id: cacheKey,
            userId,
            studentId,
            month,
            year,
            dataJson: JSON.stringify(res),
            createdAt: Date.now(),
          });
        }
      });

      return res;
    },
    enabled: !!userId && !!studentId && !!month && !!year,
    staleTime: 5 * 60 * 1000,
  });

  const queryData = query.data;

  return {
    attendance: cached ?? queryData,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
