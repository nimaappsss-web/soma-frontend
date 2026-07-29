import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useSetCurrentTerm = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      const result = await Promise.race([
        (async () => {
          const all = await db.academicTerms.where("userId").equals(user!.id).toArray();
          const updates = all.map((t) => ({
            key: t.id,
            changes: { isCurrent: t.id === id },
          }));
          for (const u of updates) {
            await db.academicTerms.update(u.key, u.changes);
          }
          await addToQueue({
            userId: user!.id,
            table: "academicTerms",
            recordId: id,
            endpoint: `/academic-terms/${id}/set-current`,
            method: "POST",
            payload: {},
          });
          return { message: "Current term updated" };
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Current term updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
