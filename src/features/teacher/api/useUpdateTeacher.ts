import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { teachers } from "../../../lib/queryKeys";
import type { UpdateTeacherPayload } from "../types";
import type { TeacherCache } from "../../../db/db";

const TIMEOUT = 3000;

interface UpdateTeacherVars {
  id: string;
  data: UpdateTeacherPayload;
}

export const useUpdateTeacher = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateTeacherVars>({
    mutationFn: async ({ id, data }) => {
      await Promise.race([
        (async () => {
          const existing = await db.teachers.get(id);
          const merged = { ...existing, ...data, id, userId: user!.id } as TeacherCache;
          await db.teachers.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "teachers",
            recordId: id,
            endpoint: `/teachers/${id}`,
            method: "PATCH",
            payload: data,
          });
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
    },
    onSuccess: async () => {
      toast.success("Teacher updated!");
      queryClient.invalidateQueries({ queryKey: teachers.lists() });
      queryClient.invalidateQueries({ queryKey: teachers.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
