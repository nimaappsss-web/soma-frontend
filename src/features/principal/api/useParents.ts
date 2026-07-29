import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { ParentCache } from "../../../db/db";
import type { Parent } from "../types";

export const useParents = (page = 1, limit = 50) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const networkQuery = useQuery<{ parents: unknown[]; total: number; page: number; totalPages: number }>({
    queryKey: ["parents", userId, page],
    queryFn: async () => {
      const res = await fetchData<{ parents: unknown[]; total: number; page: number; totalPages: number }>(`/parents?page=${page}&limit=${limit}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "parents" && i.status === "pending")
        .count();

      await db.transaction("rw", db.parents, async () => {
        if (hasPending === 0 && page === 1) {
          await db.parents.where("userId").equals(userId).delete();
        }
        if (res.parents?.length) {
          await db.parents.bulkPut(
            res.parents.map((p: Record<string, unknown>) => ({ ...p, userId }) as any),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const data = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve(undefined);
      return db.parents.where("userId").equals(userId).toArray() as Promise<ParentCache[]>;
    },
    [userId],
  );

  const cached = data && data.length > 0
    ? { parents: data as Parent[], total: data.length, page, totalPages: 1 }
    : undefined;

  const apiData = networkQuery.data?.parents?.length
    ? { parents: networkQuery.data.parents as Parent[], total: networkQuery.data.parents.length, page, totalPages: 1 }
    : undefined;

  return {
    data: cached ?? apiData,
    isLoading: data === undefined && networkQuery.isLoading,
    error: networkQuery.error ?? undefined,
  };
};
