import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useDeleteHoliday = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      const result = await Promise.race([
        (async () => {
          await db.holidays.delete(id);
          await addToQueue({
            userId: user!.id,
            table: "holidays",
            recordId: id,
            endpoint: `/holidays/${id}`,
            method: "DELETE",
            payload: null,
          });
          return { message: "Holiday removed" };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Holiday removed!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
