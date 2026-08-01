import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { UpdateExamComponentPayload, ComponentMutationResponse, AxiosErrorResponse } from "../types";

export const useUpdateExamComponent = () => {
  const queryClient = useQueryClient();

  return useMutation<ComponentMutationResponse, AxiosErrorResponse, { id: string; data: UpdateExamComponentPayload }>({
    mutationFn: ({ id, data }) => fetchData(`/exams/components/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Component updated!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
