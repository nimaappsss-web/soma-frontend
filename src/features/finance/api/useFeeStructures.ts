import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type FeeStructureCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { FeeStructure, FeeStructureListResponse, FeeItem, AxiosErrorResponse } from "../types";

interface UseFeeStructuresParams {
  classId?: string;
  term?: string;
  session?: string;
}

const fromCache = (c: FeeStructureCache): FeeStructure => ({
  id: c.id,
  classIds: c.classIdsJson ? (JSON.parse(c.classIdsJson) as string[]) : [],
  classNames: c.classNamesJson ? (JSON.parse(c.classNamesJson) as string[]) : [],
  term: c.term,
  session: c.session,
  name: c.name,
  amount: c.amount,
  items: c.itemsJson ? (JSON.parse(c.itemsJson) as FeeItem[]) : [],
  isCompulsory: c.isCompulsory,
  createdAt: new Date(c.createdAt).toISOString(),
});

export const useFeeStructures = ({ classId, term, session }: UseFeeStructuresParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as FeeStructureCache[]);
      return db.feeStructures.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<FeeStructureListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.feeStructures(), classId, term, session].filter(Boolean),
    queryFn: async () => {
      const res = await fetchData<FeeStructureListResponse>("/finance/fee-structures", "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "feeStructures" && i.status === "pending")
        .count();

      await db.transaction("rw", db.feeStructures, async () => {
        if (hasPending === 0 && !classId && !term && !session) {
          await db.feeStructures.where("userId").equals(userId).delete();
        }
        if (res.feeStructures?.length) {
          await db.feeStructures.bulkPut(
            res.feeStructures.map((f: FeeStructure) => ({
              id: f.id,
              userId,
              classIdsJson: JSON.stringify(f.classIds ?? []),
              classNamesJson: JSON.stringify(f.classNames ?? []),
              term: f.term,
              session: f.session,
              name: f.name,
              amount: f.amount,
              itemsJson: f.items ? JSON.stringify(f.items) : "[]",
              isCompulsory: f.isCompulsory,
              createdAt: f.createdAt ? new Date(f.createdAt).getTime() : Date.now(),
            })),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];
  let filtered = cachedList;
  if (classId) filtered = filtered.filter((f) => f.classIds.includes(classId));
  if (term) filtered = filtered.filter((f) => f.term === term);
  if (session) filtered = filtered.filter((f) => f.session === session);

  return {
    data: cached !== undefined ? { feeStructures: filtered } : (query.data ?? { feeStructures: [] }),
    isLoading: cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading),
    error: query.error ?? undefined,
  };
};
