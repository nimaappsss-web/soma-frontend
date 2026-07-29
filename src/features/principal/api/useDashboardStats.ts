import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import type { DashboardStats, AxiosErrorResponse } from "../types";

export const useDashboardStats = () => {
  return useQuery<DashboardStats, AxiosErrorResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetchData("/dashboard/stats", "GET"),
  });
};
