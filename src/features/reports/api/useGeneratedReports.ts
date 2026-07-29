import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { ReportListResponse, AxiosErrorResponse } from "../types";

export const useGeneratedReports = () => {
  return useQuery<ReportListResponse, AxiosErrorResponse>({
    queryKey: reportKeys.list(),
    queryFn: () => fetchData("/reports", "GET"),
  });
};
