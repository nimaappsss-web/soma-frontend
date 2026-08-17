import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type SubjectCache } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

interface CreateSubjectPayload {
  name: string;
  code?: string;
}

export const useCreateSubject = () => {
  const { user } = useAuth();

  return useMutation<SubjectCache, AxiosErrorResponse, CreateSubjectPayload>({
    mutationFn: async (payload) => {
      const id = crypto.randomUUID();
      const cache: SubjectCache = {
        id,
        userId: user!.id,
        schoolId: user?.schoolId ?? "",
        name: payload.name,
        code: payload.code,
      };
      await db.subjects.put(cache, id);
      await addToQueue({
        userId: user!.id,
        table: "subjects",
        recordId: id,
        endpoint: "/subjects",
        method: "POST",
        payload: { ...payload, id },
      });
      return cache;
    },
    onSuccess: () => {
      toast.success("Subject added!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};