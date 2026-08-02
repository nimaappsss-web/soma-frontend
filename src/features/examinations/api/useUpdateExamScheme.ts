import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { ExamSchemeInfo, AxiosErrorResponse } from "../types";

export const useUpdateExamScheme = () => {
  const queryClient = useQueryClient();

  return useMutation<ExamSchemeInfo, AxiosErrorResponse, { id: string; schoolTypes: string[] }>({
    mutationFn: ({ id, schoolTypes }) => fetchData(`/exams/schemes/${id}`, "PATCH", { schoolTypes }),
    onSuccess: async () => {
      toast.success("Configuration updated!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
