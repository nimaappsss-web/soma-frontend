import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { GenerateInvoicePayload, Invoice, AxiosErrorResponse } from "../types";

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<Invoice, AxiosErrorResponse, GenerateInvoicePayload>({
    mutationFn: (payload) => fetchData("/finance/invoices", "POST", payload),
    onSuccess: async () => {
      toast.success("Invoice generated!");
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
