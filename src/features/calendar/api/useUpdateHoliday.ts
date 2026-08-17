import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type HolidayCache } from "../../../db/db";
import type { UpdateHolidayPayload, Holiday, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useUpdateHoliday = () => {
  const { user } = useAuth();

  return useMutation<Holiday, AxiosErrorResponse, { id: string; data: UpdateHolidayPayload }>({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const existing = await db.holidays.get(id);
          const merged: HolidayCache = {
            ...existing!,
            ...data,
            userId: user!.id,
            createdAt: Date.now(),
          };
          await db.holidays.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "holidays",
            recordId: id,
            endpoint: `/holidays/${id}`,
            method: "PATCH",
            payload: data,
          });
          return { ...merged, createdBy: "" } as unknown as Holiday;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Holiday updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
