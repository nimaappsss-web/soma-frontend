import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { PaymentListResponse, AxiosErrorResponse, PaymentStatus } from "../types";

interface UsePaymentsParams {
  studentId?: string;
  invoiceId?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export const usePayments = ({ studentId, invoiceId, status, page = 1, limit = 20 }: UsePaymentsParams = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (studentId) params.set("studentId", studentId);
  if (invoiceId) params.set("invoiceId", invoiceId);
  if (status) params.set("status", status);

  return useQuery<PaymentListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.payments(), page, studentId, invoiceId, status].filter(Boolean),
    queryFn: () => fetchData(`/finance/payments?${params.toString()}`, "GET"),
  });
};