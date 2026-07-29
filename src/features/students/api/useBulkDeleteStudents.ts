import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { studentKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useBulkDeleteStudents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    onSuccess: async (_, ids) => {
      toast.success("Students deleted!");
      const listKey = studentKeys.list(user!.id);
      queryClient.setQueryData(listKey, (old: Record<string, unknown> | undefined) => {
        if (!old || !Array.isArray(old.students)) return old;
        return { ...old, students: old.students.filter((s: any) => !ids.includes(s.id)) };
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
