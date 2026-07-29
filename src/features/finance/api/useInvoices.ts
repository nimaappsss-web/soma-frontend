import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { InvoiceListResponse, AxiosErrorResponse, InvoiceStatus } from "../types";

interface UseInvoicesParams {
  classId?: string;
  status?: InvoiceStatus;
  studentId?: string;
  page?: number;
  limit?: number;
}

export const useInvoices = ({ classId, status, studentId, page = 1, limit = 20 }: UseInvoicesParams = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (classId) params.set("classId", classId);
  if (status) params.set("status", status);
  if (studentId) params.set("studentId", studentId);

  return useQuery<InvoiceListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.invoices(), page, status, classId, studentId].filter(Boolean),
    queryFn: () => fetchData(`/finance/invoices?${params.toString()}`, "GET"),
  });
};
