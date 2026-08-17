import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type AnnouncementCache } from "../../../db/db";
import type { CreateAnnouncementPayload, Announcement, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useCreateAnnouncement = () => {
  const { user } = useAuth();

  return useMutation<Announcement, AxiosErrorResponse, CreateAnnouncementPayload>({
    mutationFn: async (payload) => {
      const result = await Promise.race([
        (async () => {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          const cache: AnnouncementCache = {
            id,
            userId: user!.id,
            title: payload.title,
            message: payload.message,
            audience: payload.audience,
            priority: payload.priority,
            createdBy: user!.name ?? user!.id,
            createdAt: now,
            updatedAt: now,
          };
          await db.announcements.put(cache, id);
          await addToQueue({
            userId: user!.id,
            table: "announcements",
            recordId: id,
            endpoint: "/announcements",
            method: "POST",
            payload: { ...payload, id },
          });
          return {
            id,
            ...payload,
            createdBy: { id: user!.id, name: user!.name ?? user!.id },
            createdAt: now,
            updatedAt: now,
          } as Announcement;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: async () => {
      toast.success("Announcement published!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
