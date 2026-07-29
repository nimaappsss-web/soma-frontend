import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { FinanceSummary, AxiosErrorResponse } from "../types";

export const useFinanceSummary = () => {
  return useQuery<FinanceSummary, AxiosErrorResponse>({
    queryKey: financeKeys.summary(),
    queryFn: () => fetchData("/finance/summary", "GET"),
  });
};
