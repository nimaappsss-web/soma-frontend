import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type CalendarEventCache } from "../../../db/db";
import type { UpdateCalendarEventPayload, CalendarEvent, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useUpdateCalendarEvent = () => {
  const { user } = useAuth();

  return useMutation<CalendarEvent, AxiosErrorResponse, { id: string; data: UpdateCalendarEventPayload }>({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const existing = await db.calendarEvents.where(":id").equals(id).first();
          const merged: CalendarEventCache = {
            ...existing!,
            ...data,
            userId: user!.id,
            createdAt: Date.now(),
          };
          await db.calendarEvents.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "calendarEvents",
            recordId: id,
            endpoint: `/calendar/events/${id}`,
            method: "PATCH",
            payload: data,
          });
          return {
            id,
            title: merged.title,
            description: merged.description,
            date: merged.date,
            type: merged.type as CalendarEvent["type"],
            audience: merged.audience as CalendarEvent["audience"],
            createdBy: { id: merged.createdBy, name: merged.createdBy },
          } as CalendarEvent;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Event updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
