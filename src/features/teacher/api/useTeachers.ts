import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type TeacherCache, type PendingInviteCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, TeachersResponse } from "../types";

export const useTeachers = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve(undefined);
      return Promise.all([
        db.teachers.where("userId").equals(userId).toArray(),
        db.pendingInvites.where("userId").equals(userId).toArray(),
      ]);
    },
    [userId],
  );

  const query = useQuery<TeachersResponse, AxiosErrorResponse>({
    queryKey: teacherKeys.list(userId),
    queryFn: async () => {
      const res = await fetchData<TeachersResponse>(
        "/teachers?limit=200",
        "GET",
      );

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => (i.table === "teachers" || i.table === "pendingInvites") && i.status === "pending")
        .count();

      await db.transaction("rw", db.teachers, db.pendingInvites, async () => {
        if (hasPending === 0) {
          await db.teachers.where("userId").equals(userId).delete();
          await db.pendingInvites.where("userId").equals(userId).delete();
        }
        if (res.teachers?.length) {
          await db.teachers.bulkPut(
            res.teachers.map((t: TeacherCache) => ({ ...t, userId }) as any),
          );
        }
        if (res.pendingInvites?.length) {
          await db.pendingInvites.bulkPut(
            res.pendingInvites.map((i: PendingInviteCache) => ({ ...i, userId }) as any),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cachedTeachers = cached?.[0];
  const cachedInvites = cached?.[1];
  const isEmpty = (cachedTeachers ?? []).length === 0 && (cachedInvites ?? []).length === 0;
  const result: TeachersResponse | undefined = cached
    ? { teachers: cachedTeachers!, pendingInvites: cachedInvites! }
    : undefined;

  return {
    data: result ?? query.data ?? { teachers: [], pendingInvites: [] },
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};
