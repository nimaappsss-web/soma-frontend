import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type NotificationCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { notificationKeys } from "../utils/query-keys";
import type {
  NotificationListResponse,
  NotificationItem,
  AxiosErrorResponse,
  NotificationType,
} from "../types";

interface UseNotificationsParams {
  page?: number;
  limit?: number;
}

const fromCache = (c: NotificationCache): NotificationItem => ({
  id: c.id,
  schoolId: c.schoolId,
  userId: c.userId,
  title: c.title,
  message: c.message,
  type: c.type as NotificationType,
  route: c.route ?? null,
  data: c.data ?? null,
  read: c.read,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const toCache = (n: NotificationItem, userId: string): NotificationCache => ({
  id: n.id,
  userId,
  schoolId: n.schoolId,
  title: n.title,
  message: n.message,
  type: n.type,
  route: n.route,
  data: n.data,
  read: n.read,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

export const useNotifications = ({ page = 1, limit = 30 }: UseNotificationsParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as NotificationCache[]);
      return db.notifications
        .where("userId")
        .equals(userId)
        .reverse()
        .sortBy("createdAt");
    },
    [userId],
  );

  const query = useQuery<NotificationListResponse, AxiosErrorResponse>({
    queryKey: notificationKeys.list(page),
    queryFn: async () => {
      const res = await fetchData<NotificationListResponse>(
        `/notifications?page=${page}&limit=${limit}`,
        "GET",
      );

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "notifications" && i.status === "pending")
        .count();

      await db.transaction("rw", db.notifications, async () => {
        if (hasPending === 0 && page === 1) {
          await db.notifications.where("userId").equals(userId).delete();
        }
        if (res.notifications?.length) {
          await db.notifications.bulkPut(
            res.notifications.map((n: NotificationItem) => toCache(n, userId)),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const cachedList = cached?.map(fromCache) ?? [];
  const unreadCount =
    query.data?.unreadCount ?? cachedList.filter((n) => !n.read).length;

  return {
    data:
      cached !== undefined
        ? {
            notifications: cachedList,
            total: cachedList.length,
            page,
            totalPages: Math.ceil(cachedList.length / limit),
            unreadCount,
          }
        : (query.data ?? {
            notifications: [],
            total: 0,
            page,
            totalPages: 0,
            unreadCount: 0,
          }),
    unreadCount,
    isLoading:
      cached === undefined ||
      (Array.isArray(cached) && cached.length === 0 && query.isLoading),
    error: query.error ?? undefined,
    refetch: query.refetch,
  };
};