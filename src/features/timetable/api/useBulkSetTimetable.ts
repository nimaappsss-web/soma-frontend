import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { BulkSetTimetablePayload, BulkSetTimetableResponse, AxiosErrorResponse } from "../types";

export const useBulkSetTimetable = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkSetTimetableResponse, AxiosErrorResponse, BulkSetTimetablePayload>({
    mutationFn: (payload) => fetchData("/timetable/bulk", "POST", payload),
    onSuccess: async () => {
      toast.success("Timetable saved!");
      queryClient.invalidateQueries({ queryKey: timetableKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
