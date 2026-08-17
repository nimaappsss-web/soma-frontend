import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { attendanceKeys } from "../utils/query-keys";
import type { ClearAttendanceRequest, ClearAttendanceResponse, AxiosErrorResponse } from "../types";

export const useClearAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation<ClearAttendanceResponse, AxiosErrorResponse, ClearAttendanceRequest>({
    mutationFn: (payload) => fetchData("/attendance/bulk", "DELETE", payload),
    onSuccess: async (data) => {
      toast.success(`Attendance cleared: ${data.count} record(s)`);
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
