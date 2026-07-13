import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { BulkCreatePayload, BulkCreateResponse, AxiosErrorResponse } from "../types";

export const useBulkCreateStudents = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkCreateResponse, AxiosErrorResponse, BulkCreatePayload>({
    mutationFn: (payload) => fetchData("/students/bulk", "POST", payload),
    onSuccess: async (data) => {
      toast.success(`${data.created} student(s) added!`);
      if (data.failed?.length > 0) {
        data.failed.forEach((f) =>
          toast.error(`Row ${f.index + 1}: ${f.reason}`),
        );
      }
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
