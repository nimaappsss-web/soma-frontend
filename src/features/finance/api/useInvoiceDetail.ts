import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { financeKeys } from "../utils/query-keys";
import type { InvoiceDetail, AxiosErrorResponse } from "../types";

export const useInvoiceDetail = (id: string) => {
  const { user } = useAuth();

  return useQuery<{ invoice: InvoiceDetail }, AxiosErrorResponse>({
    queryKey: financeKeys.invoice(id),
    queryFn: () => fetchData(`/finance/invoices/${id}`, "GET"),
    enabled: !!user?.id && !!id,
  });
};