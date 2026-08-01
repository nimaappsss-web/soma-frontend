import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { CopySchemePayload, CopySchemeResponse, AxiosErrorResponse } from "../types";

export const useCopyExamComponents = () => {
  const queryClient = useQueryClient();

  return useMutation<CopySchemeResponse, AxiosErrorResponse, CopySchemePayload>({
    mutationFn: (payload) => fetchData("/exams/components/copy", "POST", payload),
    onSuccess: async () => {
      toast.success("Previous scheme copied!");
      queryClient.invalidateQueries({ queryKey: examKeys.schemes() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
