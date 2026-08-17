import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { Payment, AxiosErrorResponse } from "../types";

export const useRejectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<{ payment: Payment }, AxiosErrorResponse, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => fetchData(`/finance/payments/${id}/reject`, "PATCH", { reason }),
    onSuccess: async () => {
      toast.success("Payment rejected");
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.summary() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};