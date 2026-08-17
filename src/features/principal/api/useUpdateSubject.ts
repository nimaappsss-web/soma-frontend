import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type SubjectCache } from "../../../db/db";
import type { UpdateSubjectPayload, AxiosErrorResponse } from "../types";

export const useUpdateSubject = () => {
  const { user } = useAuth();

  return useMutation<SubjectCache, AxiosErrorResponse, { id: string; data: UpdateSubjectPayload }>({
    mutationFn: async ({ id, data }) => {
      const existing = await db.subjects.get(id);
      const merged: SubjectCache = {
        ...existing!,
        ...data,
        id,
        userId: user!.id,
        schoolId: existing?.schoolId ?? user?.schoolId ?? "",
      };
      await db.subjects.put(merged, id);
      await addToQueue({
        userId: user!.id,
        table: "subjects",
        recordId: id,
        endpoint: `/subjects/${id}`,
        method: "PATCH",
        payload: data,
      });
      return merged;
    },
    onSuccess: () => {
      toast.success("Subject updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};