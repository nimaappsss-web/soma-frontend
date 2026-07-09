import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

interface CreateClassPayload {
  name: string;
  level: string;
  arm?: string;
}

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; name: string }, AxiosErrorResponse, CreateClassPayload>({
    mutationFn: (payload) => fetchData("/classes", "POST", payload),
    onSuccess: async () => {
      toast.success("Class added!");
      queryClient.invalidateQueries({ queryKey: principalKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
