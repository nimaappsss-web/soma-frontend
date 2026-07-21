import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { parentKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { ParentCache } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { Parent } from "../types";

interface ParentsResponse {
  parents: Parent[];
  total: number;
  page: number;
  totalPages: number;
}

export const useParents = (page = 1, limit = 50) => {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [cached, setCached] = useState<Parent[]>([]);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const data = await db.parents.toArray();
      return schoolId
        ? (data as ParentCache[]).filter((p) => p.schoolId === schoolId)
        : (data as ParentCache[]);
    }).subscribe({
      next: (data) => setCached(data as Parent[]),
    });
    return () => sub.unsubscribe();
  }, [schoolId]);

  const query = useQuery<ParentsResponse>({
    queryKey: parentKeys.list(page),
    queryFn: async () => {
      const res: ParentsResponse = await fetchData(`/parents?page=${page}&limit=${limit}`, "GET");
      await db.transaction("rw", db.parents, async () => {
        await db.parents.clear();
        await db.parents.bulkAdd(
          (res.parents as ParentCache[]).map((p) => ({ ...p, schoolId: user?.schoolId })),
        );
      });
      return res;
    },
    staleTime: Infinity,
    retry: false,
  });

  return {
    data: cached.length > 0
      ? { parents: cached, total: cached.length, page, totalPages: 1 }
      : query.data,
    isLoading: query.isLoading && cached.length === 0,
    error: cached.length > 0 ? undefined : query.error,
  };
};
