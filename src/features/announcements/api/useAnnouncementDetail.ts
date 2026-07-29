import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db, type AnnouncementCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { announcementKeys } from "../utils/query-keys";
import type { Announcement, AxiosErrorResponse, AnnouncementAudience, AnnouncementPriority } from "../types";

const fromCache = (c: AnnouncementCache): Announcement => ({
  id: c.id,
  title: c.title,
  message: c.message,
  audience: c.audience as AnnouncementAudience,
  priority: c.priority as AnnouncementPriority,
  createdBy: { id: "", name: c.createdBy },
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

export const useAnnouncementDetail = (id: string) => {
  const cached = useLiveQuery(
    () => {
      if (!id) return Promise.resolve(null);
      return db.announcements.get(id) ?? null;
    },
    [id],
  );

  const query = useQuery<Announcement, AxiosErrorResponse>({
    queryKey: announcementKeys.detail(id),
    queryFn: async () => {
      const res = await fetchData<Announcement>(`/announcements/${id}`, "GET");
      await db.announcements.put({
        ...res,
        createdBy: res.createdBy.name,
        userId: res.createdBy.id,
      } as AnnouncementCache);
      return res;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: cached !== undefined ? (cached ? fromCache(cached) : null) : (query.data ?? null),
    isLoading: (cached === undefined || (!cached && query.isLoading)),
    error: query.error ?? undefined,
  };
};
