import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type CalendarEventCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { calendarKeys } from "../utils/query-keys";
import type { CalendarEventListResponse, CalendarEvent, AxiosErrorResponse, EventType } from "../types";

interface UseCalendarEventsParams {
  from?: string;
  to?: string;
  type?: EventType;
}

const fromCache = (c: CalendarEventCache): CalendarEvent => ({
  id: c.id,
  title: c.title,
  description: c.description,
  date: c.date,
  type: c.type as CalendarEvent["type"],
  audience: c.audience as CalendarEvent["audience"],
  createdBy: { id: c.createdBy, name: c.createdBy },
});

const toCache = (e: CalendarEvent, userId: string): CalendarEventCache => ({
  id: e.id,
  userId,
  title: e.title,
  description: e.description,
  date: e.date,
  type: e.type,
  audience: e.audience,
  createdBy: e.createdBy.name,
  createdAt: Date.now(),
});

export const useCalendarEvents = ({ from, to, type }: UseCalendarEventsParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as CalendarEventCache[]);
      return db.calendarEvents.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<CalendarEventListResponse, AxiosErrorResponse>({
    queryKey: [...calendarKeys.events(), from, to, type].filter(Boolean),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (type) params.set("type", type);
      const res = await fetchData<CalendarEventListResponse>(`/calendar/events?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "calendarEvents" && i.status === "pending")
        .count();

      await db.transaction("rw", db.calendarEvents, async () => {
        if (hasPending === 0 && !from && !to) {
          await db.calendarEvents.where("userId").equals(userId).delete();
        }
        if (res.events?.length) {
          await db.calendarEvents.bulkPut(
            res.events.map((e: CalendarEvent) => toCache(e, userId)),
          );
        }
      });

      return res;
    },
    enabled: !!userId && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];

  const filteredCached = cachedList.filter((e) => {
    const d = e.date.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    if (type && e.type !== type) return false;
    return true;
  });

  return {
    data: cached !== undefined ? { events: filteredCached } : (query.data ?? { events: [] }),
    isLoading: (cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading)),
    error: query.error ?? undefined,
  };
};
