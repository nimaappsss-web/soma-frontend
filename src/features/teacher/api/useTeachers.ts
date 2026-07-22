import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { TeachersResponse } from "../types";

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

  useQuery<{ teachers: unknown[]; pendingInvites: unknown[] }>({
    queryKey: ["teachers", userId],
    queryFn: async () => {
      const res = await fetchData<{ teachers: unknown[]; pendingInvites: unknown[] }>(
        "/teachers?limit=200",
        "GET",
      );
      if (res.teachers?.length) {
        await db.teachers.bulkPut(
          res.teachers.map((t: Record<string, unknown>) => ({ ...t, userId }) as any),
        );
      }
      if (res.pendingInvites?.length) {
        await db.pendingInvites.bulkPut(
          res.pendingInvites.map((i: Record<string, unknown>) => ({ ...i, userId }) as any),
        );
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const result: TeachersResponse | undefined = cached
    ? { teachers: cached[0], pendingInvites: cached[1] }
    : undefined;

  return {
    data: result,
    isLoading: cached === undefined,
    error: undefined,
  };
};
