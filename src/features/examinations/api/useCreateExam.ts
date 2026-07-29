import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { CreateExamPayload, Exam, AxiosErrorResponse } from "../types";

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation<Exam, AxiosErrorResponse, CreateExamPayload>({
    mutationFn: (payload) => fetchData("/exams", "POST", payload),
    onSuccess: async () => {
      toast.success("Exam created!");
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
