import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

interface CreateSubjectPayload {
  name: string;
  code?: string;
}

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; name: string }, AxiosErrorResponse, CreateSubjectPayload>({
    mutationFn: (payload) => fetchData("/subjects", "POST", payload),
    onSuccess: async () => {
      toast.success("Subject added!");
      queryClient.invalidateQueries({ queryKey: principalKeys.subjectLists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
