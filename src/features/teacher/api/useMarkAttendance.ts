import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { attendanceKeys } from "../utils/query-keys";
import type { MarkAttendancePayload, MarkAttendanceResponse, AxiosErrorResponse } from "../types";

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkAttendanceResponse, AxiosErrorResponse, MarkAttendancePayload>({
    mutationFn: (payload) => fetchData("/attendance/bulk", "POST", payload),
    onSuccess: (data, variables) => {
      toast.success(`Attendance saved: ${data.count} student(s)`);
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.details() });
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
