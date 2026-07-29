import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/staff/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Staff removed!");
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
