import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/exams/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Exam deleted!");
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
