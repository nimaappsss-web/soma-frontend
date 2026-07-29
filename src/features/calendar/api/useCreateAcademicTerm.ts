import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type AcademicTermCache } from "../../../db/db";
import type { CreateAcademicTermPayload, AcademicTerm, AxiosErrorResponse } from "../types";

const TIMEOUT = 3000;

export const useCreateAcademicTerm = () => {
  const { user } = useAuth();

  return useMutation<AcademicTerm, AxiosErrorResponse, CreateAcademicTermPayload>({
    mutationFn: async (payload) => {
      const result = await Promise.race([
        (async () => {
          const id = crypto.randomUUID();
          const cache: AcademicTermCache = {
            id,
            userId: user!.id,
            term: payload.term,
            session: payload.session,
            startDate: payload.startDate,
            endDate: payload.endDate,
            isCurrent: false,
          };
          await db.academicTerms.put(cache, id);
          await addToQueue({
            userId: user!.id,
            table: "academicTerms",
            recordId: id,
            endpoint: "/academic-terms",
            method: "POST",
            payload: { ...payload, id },
          });
          return { id, ...payload, isCurrent: false } as AcademicTerm;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: () => {
      toast.success("Term added!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
