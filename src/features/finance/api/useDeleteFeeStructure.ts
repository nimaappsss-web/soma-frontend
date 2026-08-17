import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useDeleteFeeStructure = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      const result = await Promise.race([
        (async () => {
          await db.transaction("rw", db.feeStructures, db.syncQueue, async () => {
            await db.feeStructures.delete(id);

            await addToQueue({
              userId: user!.id,
              table: "feeStructures",
              recordId: id,
              endpoint: `/finance/fee-structures/${id}`,
              method: "DELETE",
              payload: null,
            });
          });

          return { message: "Fee structure removed" };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Fee structure removed!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};