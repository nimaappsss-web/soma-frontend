import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { CreateStaffPayload, AxiosErrorResponse } from "../types";

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<{ staff: { id: string } }, AxiosErrorResponse, CreateStaffPayload>({
    mutationFn: (payload) => fetchData("/staff", "POST", payload),
    onSuccess: async () => {
      toast.success("Staff member added!");
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
