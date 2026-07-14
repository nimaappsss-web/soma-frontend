import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { teacherKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { TeacherCache, PendingInviteCache } from "../../../db/db";
import type { TeachersResponse } from "../types";

export const useTeachers = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [cached, setCached] = useState<TeachersResponse | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const sub = liveQuery(async () => {
      const [teachers, pendingInvites] = await Promise.all([
        db.teachers.where("userId").equals(userId).toArray(),
        db.pendingInvites.where("userId").equals(userId).toArray(),
      ]);
      return { teachers, pendingInvites } as TeachersResponse;
    }).subscribe({
      next: (data) => setCached(data),
    });
    return () => sub.unsubscribe();
  }, [userId]);

  const query = useQuery<TeachersResponse>({
    queryKey: teacherKeys.lists(),
    queryFn: async () => {
      const data: TeachersResponse = await fetchData("/teachers?limit=200", "GET");

      const pendingIds = (
        await db.syncQueue
          .where("userId")
          .equals(userId)
          .filter((item) => item.table === "teachers" && (item.status === "pending" || item.status === "syncing" || item.status === "failed"))
          .toArray()
      ).map((item) => item.recordId);
      const pendingSet = new Set(pendingIds);

      await db.transaction("rw", db.teachers, db.pendingInvites, async () => {
        const existing = await db.teachers.toArray();
        const toDelete = existing.filter((s) => !pendingSet.has(s.id)).map((s) => s.id);
        if (toDelete.length > 0) await db.teachers.bulkDelete(toDelete);

        const toAdd = data.teachers
          .filter((s) => !pendingSet.has(s.id))
          .map((t) => ({ ...t, userId })) as TeacherCache[];
        if (toAdd.length > 0) await db.teachers.bulkAdd(toAdd);

        await db.pendingInvites.clear();
        await db.pendingInvites.bulkAdd(
          data.pendingInvites.map((p) => ({ ...p, userId })) as PendingInviteCache[],
        );
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!userId,
  });

  return {
    data: cached ?? query.data,
    isLoading: query.isLoading && !cached,
    error: cached ? undefined : query.error,
  };
};
