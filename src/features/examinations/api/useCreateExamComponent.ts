import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { CreateExamComponentPayload, ComponentMutationResponse, AxiosErrorResponse } from "../types";

export const useCreateExamComponent = () => {
  const queryClient = useQueryClient();

  return useMutation<ComponentMutationResponse, AxiosErrorResponse, CreateExamComponentPayload>({
    mutationFn: (payload) => fetchData("/exams/components", "POST", payload),
    onSuccess: async () => {
      toast.success("Component added!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
