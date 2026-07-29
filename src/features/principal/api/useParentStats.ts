import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { parentKeys } from "../utils/query-keys";
import type { ParentStats, AxiosErrorResponse } from "../types";

export const useParentStats = () => {
  return useQuery<ParentStats, AxiosErrorResponse>({
    queryKey: [...parentKeys.all, "stats"],
    queryFn: () => fetchData("/parents/stats", "GET"),
  });
};
