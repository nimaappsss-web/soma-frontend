import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { Student } from "../types";

export const useAllStudents = (userId: string) => {
  const cached = useLiveQuery(
    async () => {
      if (!userId) return [];
      await db.syncQueue.where("userId").equals(userId).first();
      return db.students.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<{ students: Student[] }>({
    queryKey: studentKeys.list(userId),
    queryFn: async () => {
      const res = await fetchData<{ students: Student[] }>("/students?limit=200", "GET");

      const pendingItems = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "students" && i.status === "pending")
        .toArray();

      const hasPendingNonDelete = pendingItems.some((i) => i.method !== "DELETE");

      const pendingDeleteIds = new Set<string>();
      for (const item of pendingItems) {
        if (item.method !== "DELETE") continue;
        if (item.payload && typeof item.payload === "object" && "ids" in (item.payload as Record<string, unknown>)) {
          const ids = (item.payload as { ids: string[] }).ids;
          ids.forEach((id) => pendingDeleteIds.add(id));
        } else {
          pendingDeleteIds.add(item.recordId);
        }
      }

      await db.transaction("rw", db.students, async () => {
        const existing = await db.students.where("userId").equals(userId).toArray();
        const existingById = new Map(existing.map((e) => [e.id, e]));
        if (!hasPendingNonDelete) {
          await db.students.where("userId").equals(userId).delete();
        }
        const studentsToWrite = (res.students ?? []).filter((s: Student) => !pendingDeleteIds.has(s.id));
        if (studentsToWrite.length) {
          await db.students.bulkPut(
            studentsToWrite.map(
              (s: Record<string, unknown>) =>
                ({
                  ...existingById.get(s.id as string),
                  ...s,
                  userId,
                  createdAt: Date.now(),
                }) as any,
            ),
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
    data: cached !== undefined
      ? [...cached].sort((a, b) => a.name.localeCompare(b.name))
      : (query.data?.students ?? []),
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};
