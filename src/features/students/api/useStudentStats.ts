import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";

interface StudentStats {
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  averageAge: number;
  attendanceRate: number;
  averageScore: number;
  topPerformers: number;
  atRiskStudents: number;
  classDistribution: { className: string; count: number }[];
}

export const useStudentStats = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cacheKey = `studentStats-${userId}`;

  const cached = useLiveQuery(
    async () => {
      if (!userId) return undefined;
      const record = await db.studentStats
        .where("id")
        .equals(cacheKey)
        .first();
      if (!record) return undefined;
      try {
        return JSON.parse(record.dataJson) as StudentStats;
      } catch {
        return undefined;
      }
    },
    [cacheKey, userId],
  );

  const query = useQuery<StudentStats, Error>({
    queryKey: ["studentStats"],
    queryFn: async () => {
      const res = await fetchData<StudentStats>("/students/stats", "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "studentStats" && i.status === "pending")
        .count();

      await db.transaction("rw", db.studentStats, async () => {
        if (hasPending === 0) {
          await db.studentStats.where("id").equals(cacheKey).delete();
        }
        await db.studentStats.put({
          id: cacheKey,
          userId,
          dataJson: JSON.stringify(res),
          createdAt: Date.now(),
        });
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const queryData = query.data;

  return {
    stats: cached ?? queryData,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
