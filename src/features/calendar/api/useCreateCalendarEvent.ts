import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type CalendarEventCache } from "../../../db/db";
import type { CreateCalendarEventPayload, CalendarEvent, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useCreateCalendarEvent = () => {
  const { user } = useAuth();

  return useMutation<CalendarEvent, AxiosErrorResponse, CreateCalendarEventPayload>({
    mutationFn: async (payload) => {
      const result = await Promise.race([
        (async () => {
          const id = crypto.randomUUID();
          const cache: CalendarEventCache = {
            id,
            userId: user!.id,
            title: payload.title,
            description: payload.description ?? null,
            date: payload.date,
            type: payload.type,
            audience: payload.audience,
            createdBy: user!.name ?? user!.id,
            createdAt: Date.now(),
          };
          await db.calendarEvents.put(cache, id);
          await addToQueue({
            userId: user!.id,
            table: "calendarEvents",
            recordId: id,
            endpoint: "/calendar/events",
            method: "POST",
            payload: { ...payload, id },
          });
          return {
            id,
            title: payload.title,
            description: payload.description ?? null,
            date: payload.date,
            type: payload.type,
            audience: payload.audience,
            createdBy: { id: user!.id, name: user!.name ?? user!.id },
          } as CalendarEvent;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Event created!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
