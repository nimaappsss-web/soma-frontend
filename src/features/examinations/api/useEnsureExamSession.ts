import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { EnsureExamSessionPayload, EnsureExamSessionResponse, AxiosErrorResponse } from "../types";

export const useEnsureExamSession = () => {
  const queryClient = useQueryClient();

  return useMutation<EnsureExamSessionResponse, AxiosErrorResponse, EnsureExamSessionPayload>({
    mutationFn: (payload) => fetchData("/exams/ensure", "POST", payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
