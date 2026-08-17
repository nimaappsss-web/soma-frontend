import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { ReserveBatchRequest, ReserveBatchResponse, AxiosErrorResponse } from "../types";

export const useReserveBatchAdmission = () => {
  const queryClient = useQueryClient();

  return useMutation<ReserveBatchResponse, AxiosErrorResponse, ReserveBatchRequest>({
    mutationFn: (payload) => fetchData("/students/reserve-batch", "POST", payload),
    onSuccess: async () => {
      toast.success("Admission numbers reserved!");
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
