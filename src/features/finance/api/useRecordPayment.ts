import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { RecordPaymentPayload, Payment, AxiosErrorResponse } from "../types";

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<Payment, AxiosErrorResponse, RecordPaymentPayload>({
    mutationFn: (payload) => fetchData("/finance/payments", "POST", payload),
    onSuccess: async () => {
      toast.success("Payment recorded!");
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.summary() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
