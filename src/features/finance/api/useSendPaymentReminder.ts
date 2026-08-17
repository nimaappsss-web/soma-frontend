import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useSendPaymentReminder = () => {
  const queryClient = useQueryClient();

  return useMutation<{ sent: number }, AxiosErrorResponse, { invoiceId: string }>({
    mutationFn: ({ invoiceId }) => fetchData(`/finance/invoices/${invoiceId}/remind`, "POST"),
    onSuccess: async (data) => {
      toast.success(`Reminder sent to ${data.sent} parent${data.sent === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};