import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type HolidayCache } from "../../../db/db";
import type { CreateHolidayPayload, Holiday, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useCreateHoliday = () => {
  const { user } = useAuth();

  return useMutation<Holiday, AxiosErrorResponse, CreateHolidayPayload>({
    mutationFn: async (payload) => {
      const result = await Promise.race([
        (async () => {
          const id = crypto.randomUUID();
          const cache: HolidayCache = {
            id,
            userId: user!.id,
            date: payload.date,
            reason: payload.reason,
            createdAt: Date.now(),
          };
          await db.holidays.put(cache, id);
          await addToQueue({
            userId: user!.id,
            table: "holidays",
            recordId: id,
            endpoint: "/holidays",
            method: "POST",
            payload: { ...payload, id },
          });
          return { id, ...payload, createdBy: user!.id } as Holiday;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Holiday added!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
