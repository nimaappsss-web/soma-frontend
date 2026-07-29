import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { GeneratedReport, AxiosErrorResponse } from "../types";

export const useReportDetail = (id: string) => {
  return useQuery<GeneratedReport, AxiosErrorResponse>({
    queryKey: reportKeys.detail(id),
    queryFn: () => fetchData(`/reports/${id}`, "GET"),
    enabled: !!id,
  });
};
