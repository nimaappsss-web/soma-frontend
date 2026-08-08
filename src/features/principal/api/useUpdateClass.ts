import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type ClassCache } from "../../../db/db";
import type { UpdateClassPayload, AxiosErrorResponse } from "../types";

export const useUpdateClass = () => {
  const { user } = useAuth();

  return useMutation<ClassCache, AxiosErrorResponse, { id: string; data: UpdateClassPayload }>({
    mutationFn: async ({ id, data }) => {
      const existing = await db.classes.get(id);
      const merged: ClassCache = {
        ...existing!,
        ...data,
        id,
        userId: user!.id,
        schoolId: existing?.schoolId ?? user?.schoolId ?? "",
      };
      await db.classes.put(merged, id);
      await addToQueue({
        userId: user!.id,
        table: "classes",
        recordId: id,
        endpoint: `/classes/${id}`,
        method: "PATCH",
        payload: data,
      });
      return merged;
    },
    onSuccess: () => {
      toast.success("Class updated!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};