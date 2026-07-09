import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/subjects/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Subject removed!");
      queryClient.invalidateQueries({ queryKey: principalKeys.subjectLists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
