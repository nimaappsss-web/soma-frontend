import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { AvailableReportsResponse, AxiosErrorResponse } from "../types";

export const useAvailableReports = () => {
  return useQuery<AvailableReportsResponse, AxiosErrorResponse>({
    queryKey: reportKeys.available(),
    queryFn: () => fetchData("/reports/available", "GET"),
  });
};
