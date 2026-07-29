import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { classKeys } from "../utils/query-keys";
import type { UpdateClassPayload, AxiosErrorResponse } from "../types";

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, { id: string; data: UpdateClassPayload }>({
    mutationFn: ({ id, data }) => fetchData(`/classes/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Class updated!");
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
