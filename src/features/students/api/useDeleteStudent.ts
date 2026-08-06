import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { AxiosErrorResponse } from "../types";

export const useDeleteStudent = () => {
  const { user } = useAuth();

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
    onSuccess: async () => {
      toast.success("Student deleted!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
