import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { studentKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteStudent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, AxiosErrorResponse, string>({
    mutationFn: async (id) => {
      await db.students.delete(id);
      await addToQueue({
        userId: user!.id,
        table: "students",
        recordId: id,
        endpoint: `/students/${id}`,
        method: "DELETE",
        payload: null,
      });
    },
    onSuccess: async (_, id) => {
      toast.success("Student deleted!");
      const listKey = studentKeys.list(user!.id);
      queryClient.setQueryData(listKey, (old: Record<string, unknown> | undefined) => {
        if (!old || !Array.isArray(old.students)) return old;
        return { ...old, students: old.students.filter((s: any) => s.id !== id) };
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
