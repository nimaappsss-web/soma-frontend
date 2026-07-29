import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type AnnouncementCache } from "../../../db/db";
import type { UpdateAnnouncementPayload, Announcement, AxiosErrorResponse, AnnouncementAudience, AnnouncementPriority } from "../types";

const TIMEOUT = 3000;

export const useUpdateAnnouncement = () => {
  const { user } = useAuth();

  return useMutation<Announcement, AxiosErrorResponse, { id: string; data: UpdateAnnouncementPayload }>({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const existing = await db.announcements.get(id);
          const merged: AnnouncementCache = {
            ...existing!,
            ...data,
            userId: user!.id,
            updatedAt: new Date().toISOString(),
          };
          await db.announcements.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "announcements",
            recordId: id,
            endpoint: `/announcements/${id}`,
            method: "PATCH",
            payload: data,
          });
          return {
            id,
            title: merged.title,
            message: merged.message,
            audience: merged.audience as AnnouncementAudience,
            priority: merged.priority as AnnouncementPriority,
            createdBy: { id: merged.createdBy, name: merged.createdBy },
            createdAt: merged.createdAt,
            updatedAt: merged.updatedAt,
          } as Announcement;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: async () => {
      toast.success("Announcement updated!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
