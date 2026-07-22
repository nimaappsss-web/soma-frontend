import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Student } from "../types";

export const useStudents = (classId: string, status: string = "ACTIVE", _userId?: string, schoolId?: string) => {
  const cached = useLiveQuery(
    () => {
      if (!classId) return Promise.resolve([] as Student[]);
      return db.students
        .where("classId")
        .equals(classId)
        .filter((s) => s.status === status)
        .toArray() as Promise<Student[]>;
    },
    [classId, status],
  );

  const query = useQuery({
    queryKey: ["students", classId, status],
    queryFn: async () => {
      const res = await fetchData<{ students: Student[] }>(
        `/students?classId=${classId}&status=${status}&limit=200`,
        "GET",
      );
      if (res.students?.length) {
        await db.students.where("classId").equals(classId).delete();
        await db.students.bulkAdd(res.students.map((s) => ({ ...s, createdAt: Date.now() })));
      }
      return res;
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });

  const fromCache = cached?.filter((s) => !schoolId || s.schoolId === schoolId) ?? [];

  return {
    data: query.data?.students ?? fromCache,
    isLoading: fromCache.length === 0 && query.isLoading,
    error: query.error ?? undefined,
  };
};
