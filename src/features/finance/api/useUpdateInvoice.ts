import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { InvoiceStatus, Invoice, AxiosErrorResponse } from "../types";

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<Invoice, AxiosErrorResponse, { id: string; data: { status: InvoiceStatus } }>({
    mutationFn: ({ id, data }) => fetchData(`/finance/invoices/${id}`, "PATCH", data),
    onSuccess: async () => {
      toast.success("Invoice updated!");
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
