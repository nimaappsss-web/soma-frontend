import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { CreateStaffPayload, AxiosErrorResponse } from "../types";

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, { id: string; data: Partial<CreateStaffPayload> }>({
    mutationFn: ({ id, data }) => fetchData(`/staff/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Staff updated!");
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: staffKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
