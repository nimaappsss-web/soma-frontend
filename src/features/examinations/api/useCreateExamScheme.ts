import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { CreateScoreSchemePayload, ExamSchemeInfo, AxiosErrorResponse } from "../types";

export const useCreateExamScheme = () => {
  const queryClient = useQueryClient();

  return useMutation<ExamSchemeInfo, AxiosErrorResponse, CreateScoreSchemePayload>({
    mutationFn: (payload) => fetchData("/exams/schemes", "POST", payload),
    onSuccess: async () => {
      toast.success("Configuration created!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
