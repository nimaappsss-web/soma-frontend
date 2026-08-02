import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

interface DeleteSchemeResponse {
  message: string;
  session: string;
  schemes: Array<{
    schemeId: string;
    schoolTypes: string[];
    schemeTotal: number;
    complete: boolean;
    warning: string | null;
  }>;
}

export const useDeleteExamScheme = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteSchemeResponse, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/exams/schemes/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Configuration deleted!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
      queryClient.invalidateQueries({ queryKey: examKeys.scheme({}) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
