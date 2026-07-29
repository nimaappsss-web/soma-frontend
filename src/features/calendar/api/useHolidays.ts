import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type HolidayCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { calendarKeys } from "../utils/query-keys";
import type { HolidayListResponse, Holiday, AxiosErrorResponse } from "../types";

interface UseHolidaysParams {
  from?: string;
  to?: string;
}

const fromCache = (c: HolidayCache): Holiday => ({
  id: c.id,
  date: c.date,
  reason: c.reason,
  createdBy: "",
});

export const useHolidays = ({ from, to }: UseHolidaysParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as HolidayCache[]);
      return db.holidays.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<HolidayListResponse, AxiosErrorResponse>({
    queryKey: [...calendarKeys.holidays(), from, to].filter(Boolean),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetchData<HolidayListResponse>(`/holidays?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "holidays" && i.status === "pending")
        .count();

      await db.transaction("rw", db.holidays, async () => {
        if (hasPending === 0 && !from && !to) {
          await db.holidays.where("userId").equals(userId).delete();
        }
        if (res.holidays?.length) {
          await db.holidays.bulkPut(
            res.holidays.map((h) => ({ id: h.id, userId, date: h.date, reason: h.reason, createdAt: Date.now() })),
          );
        }
      });

      return res;
    },
    enabled: !!userId && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];

  return {
    data: cached !== undefined ? { holidays: cachedList } : (query.data ?? { holidays: [] }),
    isLoading: (cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading)),
    error: query.error ?? undefined,
  };
};
