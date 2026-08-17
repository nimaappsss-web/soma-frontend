import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useDeleteTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/timetable/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Timetable entry removed!");
      queryClient.invalidateQueries({ queryKey: timetableKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
