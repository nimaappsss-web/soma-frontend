import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

export const useDeleteClass = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      await db.classes.delete(id);
      await addToQueue({
        userId: user!.id,
        table: "classes",
        recordId: id,
        endpoint: `/classes/${id}`,
        method: "DELETE",
        payload: null,
      });
      return { message: "Class removed" };
    },
    onSuccess: () => {
      toast.success("Class removed!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};