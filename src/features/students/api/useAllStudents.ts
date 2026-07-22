import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Student } from "../types";

export const useAllStudents = (userId: string) => {
  const cached = useLiveQuery(
    () => (userId ? db.students.where("userId").equals(userId).toArray() : Promise.resolve([])) as Promise<Student[]>,
    [userId],
  );

  const query = useQuery<{ students: Student[] }>({
    queryKey: ["students", "all", userId],
    queryFn: async () => {
      const res = await fetchData<{ students: Student[] }>("/students?limit=200", "GET");
      if (res.students?.length) {
        await db.students.bulkPut(
          res.students.map((s: Record<string, unknown>) => ({ ...s, userId, createdAt: Date.now() }) as any),
        );
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const fromCache = cached ?? [];

  return {
    data: fromCache.length > 0
      ? [...fromCache].sort((a, b) => a.name.localeCompare(b.name))
      : (query.data?.students ?? []),
    isLoading: fromCache.length === 0 && query.isLoading,
    error: query.error ?? undefined,
  };
};
