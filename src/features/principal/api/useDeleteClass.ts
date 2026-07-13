import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { classKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/classes/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Class removed!");
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
