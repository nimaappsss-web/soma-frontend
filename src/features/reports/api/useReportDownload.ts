import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { ReportDownloadResponse, AxiosErrorResponse } from "../types";

export const useReportDownload = (id: string) => {
  return useQuery<ReportDownloadResponse, AxiosErrorResponse>({
    queryKey: reportKeys.download(id),
    queryFn: () => fetchData(`/reports/${id}/download`, "GET"),
    enabled: !!id,
  });
};
