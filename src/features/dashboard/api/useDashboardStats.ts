import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { dashboardKeys } from "../utils/query-keys";
import type { DashboardStats, AxiosErrorResponse } from "../types";

export const useDashboardStats = (options?: { enabled?: boolean }) => {
  return useQuery<DashboardStats, AxiosErrorResponse>({
    queryKey: dashboardKeys.stats(),
    queryFn: () => fetchData("/dashboard/stats", "GET"),
    enabled: options?.enabled ?? true,
  });
};
