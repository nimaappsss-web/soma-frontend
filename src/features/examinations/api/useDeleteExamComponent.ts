import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

interface DeleteComponentResponse {
  message: string;
  schemeTotal: number;
  complete: boolean;
  warning: string | null;
}

export const useDeleteExamComponent = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteComponentResponse, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/exams/components/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Component removed!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
