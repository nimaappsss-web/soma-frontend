import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { Payment, AxiosErrorResponse } from "../types";

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { payment: Payment; invoiceStatus: string; remainingAfter: number; clamped: boolean },
    AxiosErrorResponse,
    { id: string; amount?: number }
  >({
    mutationFn: ({ id, amount }) => fetchData(`/finance/payments/${id}/confirm`, "PATCH", { amount }),
    onSuccess: async (data) => {
      toast.success(data.clamped ? "Payment confirmed — amount clamped to remaining balance" : "Payment confirmed!");
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.summary() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};