import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { Student as StudentCache } from "../../../db/db";
import type { Student } from "../types";

interface PaginatedResponse {
  students: Student[];
  total: number;
  page: number;
  totalPages: number;
}

export const useStudents = (classId: string, status: string = "ACTIVE", userId?: string) => {
  const [cached, setCached] = useState<Student[]>([]);

  useEffect(() => {
    if (!classId) return;
    const sub = liveQuery(() =>
      db.students
        .where("classId")
        .equals(classId)
        .filter((s) => s.status === status)
        .toArray(),
    ).subscribe({
      next: (data) => setCached(data as Student[]),
    });
    return () => sub.unsubscribe();
  }, [classId, status]);

  const query = useQuery<Student[]>({
    queryKey: [...studentKeys.lists(), classId, status],
    queryFn: async () => {
      const res: PaginatedResponse = await fetchData(
        `/students?classId=${classId}&status=${status}&limit=200`,
        "GET",
      );
      const apiStudents = res.students;

      const pendingIds = (
        await db.syncQueue
          .where("userId")
          .equals(userId ?? "")
          .filter((item) => item.table === "students" && (item.status === "pending" || item.status === "syncing" || item.status === "failed"))
          .toArray()
      ).map((item) => item.recordId);
      const pendingSet = new Set(pendingIds);

      await db.transaction("rw", db.students, async () => {
        const existing = await db.students
          .where("classId")
          .equals(classId)
          .filter((s) => s.status === status)
          .toArray();
        const toDelete = existing.filter((s) => !pendingSet.has(s.id)).map((s) => s.id);
        if (toDelete.length > 0) await db.students.bulkDelete(toDelete);
        const toAdd = apiStudents
          .filter((s) => !pendingSet.has(s.id))
          .map((s) => ({ ...s, createdAt: Date.now() }) as StudentCache);
        if (toAdd.length > 0) await db.students.bulkAdd(toAdd);
      });
      return apiStudents;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!classId,
    retry: false,
  });

  return {
    data: cached.length > 0 ? cached : query.data ?? [],
    isLoading: query.isLoading && cached.length === 0,
    error: query.error,
  };
};
