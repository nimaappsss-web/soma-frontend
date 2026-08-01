import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type AcademicTermCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { calendarKeys } from "../utils/query-keys";
import type { AcademicTermListResponse, AcademicTerm, AxiosErrorResponse } from "../types";

const fromCache = (c: AcademicTermCache): AcademicTerm => ({
  id: c.id,
  term: c.term,
  startDate: c.startDate,
  endDate: c.endDate,
  isCurrent: c.isCurrent,
});

export const useAcademicTerms = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as AcademicTermCache[]);
      return db.academicTerms.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<AcademicTermListResponse, AxiosErrorResponse>({
    queryKey: calendarKeys.terms(),
    queryFn: async () => {
      const res = await fetchData<AcademicTermListResponse>("/academic-terms", "GET");
      if (res.terms && userId) {
        const local = await db.academicTerms.where("userId").equals(userId).toArray();
        const pendingForTerm = new Set(
          (await db.syncQueue
            .where({ table: "academicTerms", status: "pending" })
            .toArray())
            .map((q) => q.recordId),
        );
        const merged = res.terms.map((t: AcademicTerm) => {
          const match = local.find((l) => l.id === t.id);
          if (match) {
            return {
              ...match,
              isCurrent: pendingForTerm.has(t.id) ? match.isCurrent : (t as any).isCurrent ?? match.isCurrent,
            };
          }
          return { ...t, userId, isCurrent: (t as any).isCurrent ?? false };
        });
        const localOnly = local.filter((l) => !res.terms!.some((t: AcademicTerm) => t.id === l.id));
        await db.academicTerms.bulkPut([...merged, ...localOnly]);
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];

  return {
    data: cached !== undefined ? { terms: cachedList } : (query.data ?? { terms: [] }),
    isLoading: (cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading)),
    error: query.error ?? undefined,
  };
};
