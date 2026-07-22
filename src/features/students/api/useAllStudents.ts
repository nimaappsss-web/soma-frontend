import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Student } from "../types";

export const useAllStudents = (_userId: string, schoolId?: string) => {
  const cached = useLiveQuery(
    () => db.students.toArray() as Promise<Student[]>,
    [],
  );

  const query = useQuery({
    queryKey: ["students", "all"],
    queryFn: async () => {
      const res = await fetchData<{ students: Student[] }>("/students?limit=200", "GET");
      if (res.students?.length) {
        await db.students.clear();
        await db.students.bulkAdd(res.students.map((s) => ({ ...s, createdAt: Date.now() })));
      }
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const fromCache = cached
    ? schoolId
      ? cached.filter((s) => s.schoolId === schoolId)
      : cached
    : [];

  return {
    data: fromCache.length > 0
      ? [...fromCache].sort((a, b) => a.name.localeCompare(b.name))
      : (query.data?.students ?? []),
    isLoading: fromCache.length === 0 && query.isLoading,
    error: query.error ?? undefined,
  };
};
