import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db, type ClassCache } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

interface CreateClassPayload {
  name: string;
  level: string;
  arm?: string;
  schoolType?: string;
}

export const useCreateClass = () => {
  const { user } = useAuth();

  return useMutation<ClassCache, AxiosErrorResponse, CreateClassPayload>({
    mutationFn: async (payload) => {
      const id = crypto.randomUUID();
      const cache: ClassCache = {
        id,
        userId: user!.id,
        schoolId: user?.schoolId ?? "",
        name: payload.name,
        level: payload.level,
        arm: payload.arm,
        schoolType: payload.schoolType,
      };
      await db.classes.put(cache, id);
      await addToQueue({
        userId: user!.id,
        table: "classes",
        recordId: id,
        endpoint: "/classes",
        method: "POST",
        payload: { ...payload, id },
      });
      return cache;
    },
    onSuccess: () => {
      toast.success("Class added!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};