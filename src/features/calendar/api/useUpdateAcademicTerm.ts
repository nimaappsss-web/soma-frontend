import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type AcademicTermCache } from "../../../db/db";
import type { UpdateAcademicTermPayload, AcademicTerm, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useUpdateAcademicTerm = () => {
  const { user } = useAuth();

  return useMutation<AcademicTerm, AxiosErrorResponse, { id: string; data: UpdateAcademicTermPayload }>({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const existing = await db.academicTerms.get(id);
          const merged: AcademicTermCache = {
            ...existing!,
            ...data,
            userId: user!.id,
          };
          await db.academicTerms.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "academicTerms",
            recordId: id,
            endpoint: `/academic-terms/${id}`,
            method: "PATCH",
            payload: data,
          });
          return { ...merged } as AcademicTerm;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Term updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
