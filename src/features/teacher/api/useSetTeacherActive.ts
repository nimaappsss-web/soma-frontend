import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { teachers } from "../../../lib/queryKeys";
import type { AxiosErrorResponse } from "../types";

interface ActiveResponse {
  message: string;
}

interface SetTeacherActivePayload {
  id: string;
  active: boolean;
}

export const useSetTeacherActive = () => {
  const queryClient = useQueryClient();

  return useMutation<ActiveResponse, AxiosErrorResponse, SetTeacherActivePayload>({
    mutationFn: ({ id, active }) =>
      fetchData(`/teachers/${id}/active`, "PATCH", { active }),
    onSuccess: async (_data, { active }) => {
      toast.success(active ? "Teacher activated!" : "Teacher deactivated!");
      queryClient.invalidateQueries({ queryKey: teachers.all });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};