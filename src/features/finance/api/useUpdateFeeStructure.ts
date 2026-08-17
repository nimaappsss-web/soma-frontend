import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { UpdateFeeStructurePayload, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useUpdateFeeStructure = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, { id: string; data: UpdateFeeStructurePayload }>({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const target = await db.feeStructures.get(id);
          if (!target) throw new Error("Fee structure not found");

          const items = data.items ?? [];
          const amount = items.length > 0 ? items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0) : target.amount;

          await db.transaction("rw", db.feeStructures, db.syncQueue, async () => {
            await db.feeStructures.put({
              ...target,
              name: data.name ?? target.name,
              isCompulsory: data.isCompulsory ?? target.isCompulsory,
              amount,
              itemsJson: items.length > 0 ? JSON.stringify(items) : target.itemsJson,
              updatedAt: Date.now(),
            });

            await addToQueue({
              userId: user!.id,
              table: "feeStructures",
              recordId: id,
              endpoint: `/finance/fee-structures/${id}`,
              method: "PATCH",
              payload: data,
            });
          });

          return { message: "Fee structure updated" };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Fee structure updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};