import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { ReportHistoryResponse, AxiosErrorResponse } from "../types";

export const useReportHistory = (page = 1, limit = 20) => {
  return useQuery<ReportHistoryResponse, AxiosErrorResponse>({
    queryKey: reportKeys.history(page),
    queryFn: () => fetchData(`/reports/history?page=${page}&limit=${limit}`, "GET"),
  });
};
