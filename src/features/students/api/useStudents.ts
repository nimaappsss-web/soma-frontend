import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type { Student as DbStudent } from "../../../db/db";
import type { Student } from "../types";

export const useStudents = (classId: string, status: string = "ACTIVE", _userId?: string, schoolId?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!classId || !userId) return Promise.resolve([] as DbStudent[]);
      return db.students
        .where("[userId+classId]")
        .equals([userId, classId])
        .filter((s) => s.status === status)
        .toArray() as Promise<DbStudent[]>;
    },
    [classId, status, userId],
  );

  const query = useQuery<{ students: Student[] }>({
    queryKey: ["students", classId, status],
    queryFn: async () => {
      const res = await fetchData<{ students: Student[] }>(
        `/students?classId=${classId}&status=${status}&limit=200`,
        "GET",
      );
      if (res.students?.length) {
        await db.students.bulkPut(
          res.students.map((s: Record<string, unknown>) => ({ ...s, userId, createdAt: Date.now() }) as any),
        );
      }
      return res;
    },
    enabled: !!classId && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const fromCache = cached?.filter((s) => !schoolId || s.schoolId === schoolId) ?? [];

  return {
    data: fromCache.length > 0 ? fromCache : (query.data?.students ?? []),
    isLoading: fromCache.length === 0 && query.isLoading,
    error: query.error ?? undefined,
  };
};
