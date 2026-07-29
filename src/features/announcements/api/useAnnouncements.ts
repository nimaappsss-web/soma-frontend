import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type AnnouncementCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { announcementKeys } from "../utils/query-keys";
import type { AnnouncementListResponse, Announcement, AxiosErrorResponse, AnnouncementAudience, AnnouncementPriority } from "../types";

interface UseAnnouncementsParams {
  page?: number;
  limit?: number;
  audience?: AnnouncementAudience;
  priority?: AnnouncementPriority;
}

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

const toCache = (a: Announcement, userId: string): AnnouncementCache => ({
  id: a.id,
  userId,
  title: a.title,
  message: a.message,
  audience: a.audience,
  priority: a.priority,
  createdBy: a.createdBy.name,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

export const useAnnouncements = ({ page = 1, limit = 20, audience, priority }: UseAnnouncementsParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as AnnouncementCache[]);
      return db.announcements.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (audience) params.set("audience", audience);
  if (priority) params.set("priority", priority);

  const query = useQuery<AnnouncementListResponse, AxiosErrorResponse>({
    queryKey: [...announcementKeys.list(page), audience, priority].filter(Boolean),
    queryFn: async () => {
      const res = await fetchData<AnnouncementListResponse>(`/announcements?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "announcements" && i.status === "pending")
        .count();

      await db.transaction("rw", db.announcements, async () => {
        if (hasPending === 0 && page === 1) {
          await db.announcements.where("userId").equals(userId).delete();
        }
        if (res.announcements?.length) {
          await db.announcements.bulkPut(
            res.announcements.map((a) => toCache(a, userId)),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];

  return {
    data: cached !== undefined
      ? { announcements: cachedList, total: cachedList.length, page, totalPages: Math.ceil(cachedList.length / limit) }
      : (query.data ?? { announcements: [], total: 0, page, totalPages: 0 }),
    isLoading: (cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading)),
    error: query.error ?? undefined,
  };
};
