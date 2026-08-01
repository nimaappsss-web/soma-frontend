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
    onSuccess: async (_data, { id }) => {
      toast.success("Assessment updated!");
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      queryClient.invalidateQueries({ queryKey: examKeys.details() });
      queryClient.invalidateQueries({ queryKey: examKeys.scores(id) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
