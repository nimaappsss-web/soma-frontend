import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { UpdateExamPayload, Exam, AxiosErrorResponse } from "../types";

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation<Exam, AxiosErrorResponse, { id: string; data: UpdateExamPayload }>({
    mutationFn: ({ id, data }) => fetchData(`/exams/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Exam updated!");
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      queryClient.invalidateQueries({ queryKey: examKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
