import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

export const useDeleteSubject = () => {
  const { user } = useAuth();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      await db.subjects.delete(id);
      await addToQueue({
        userId: user!.id,
        table: "subjects",
        recordId: id,
        endpoint: `/subjects/${id}`,
        method: "DELETE",
        payload: null,
      });
      return { message: "Subject removed" };
    },
    onSuccess: () => {
      toast.success("Subject removed!");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};