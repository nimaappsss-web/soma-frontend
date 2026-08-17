import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { CreateFeeStructurePayload, FeeStructure, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useCreateFeeStructure = () => {
  const { user } = useAuth();

  return useMutation<{ feeStructure: FeeStructure }, AxiosErrorResponse, CreateFeeStructurePayload>({
    mutationFn: async (payload) => {
      const result = await Promise.race([
        (async () => {
          const id = crypto.randomUUID();
          const total = payload.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

          const row: FeeStructure = {
            id,
            classIds: payload.classIds,
            term: payload.term,
            session: payload.session,
            name: payload.name,
            amount: total,
            items: payload.items,
            isCompulsory: payload.isCompulsory,
          };

          await db.transaction("rw", db.feeStructures, db.syncQueue, async () => {
            await db.feeStructures.put({
              id: row.id,
              userId: user!.id,
              classIdsJson: JSON.stringify(row.classIds),
              classNamesJson: "[]",
              term: row.term,
              session: row.session,
              name: row.name,
              amount: row.amount,
              itemsJson: JSON.stringify(row.items ?? []),
              isCompulsory: row.isCompulsory,
              createdAt: Date.now(),
            });

            await addToQueue({
              userId: user!.id,
              table: "feeStructures",
              recordId: id,
              endpoint: "/finance/fee-structures",
              method: "POST",
              payload: {
                classIds: row.classIds,
                term: row.term,
                session: row.session,
                name: row.name,
                isCompulsory: row.isCompulsory,
                items: row.items,
              },
            });
          });

          return { feeStructure: row };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Fee structure added!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};