import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { subjectKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/subjects/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Subject removed!");
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
