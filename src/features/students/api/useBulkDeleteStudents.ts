import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { AxiosErrorResponse } from "../types";

export const useBulkDeleteStudents = () => {
  const { user } = useAuth();

  return useMutation<void, AxiosErrorResponse, string[]>({
    mutationFn: async (ids) => {
      await db.students.bulkDelete(ids);
      await addToQueue({
        userId: user!.id,
        table: "students",
        recordId: `bulk_delete_${Date.now()}`,
        endpoint: "/students/bulk",
        method: "DELETE",
        payload: { ids },
      });
    },
    onSuccess: async () => {
      toast.success("Students deleted!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
