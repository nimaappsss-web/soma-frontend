import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { PaymentListResponse, AxiosErrorResponse } from "../types";

interface UsePaymentsParams {
  studentId?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
}

export const usePayments = ({ studentId, invoiceId, page = 1, limit = 20 }: UsePaymentsParams = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (studentId) params.set("studentId", studentId);
  if (invoiceId) params.set("invoiceId", invoiceId);

  return useQuery<PaymentListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.payments(), page, studentId, invoiceId].filter(Boolean),
    queryFn: () => fetchData(`/finance/payments?${params.toString()}`, "GET"),
  });
};
