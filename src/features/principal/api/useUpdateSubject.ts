import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { subjectKeys } from "../utils/query-keys";
import type { UpdateSubjectPayload, AxiosErrorResponse } from "../types";

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, { id: string; data: UpdateSubjectPayload }>({
    mutationFn: ({ id, data }) => fetchData(`/subjects/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Subject updated!");
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
