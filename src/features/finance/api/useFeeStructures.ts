import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { FeeStructureListResponse, AxiosErrorResponse } from "../types";

interface UseFeeStructuresParams {
  classId?: string;
  term?: string;
  session?: string;
}

export const useFeeStructures = ({ classId, term, session }: UseFeeStructuresParams = {}) => {
  const params = new URLSearchParams();
  if (classId) params.set("classId", classId);
  if (term) params.set("term", term);
  if (session) params.set("session", session);

  return useQuery<FeeStructureListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.feeStructures(), classId, term, session].filter(Boolean),
    queryFn: () => fetchData(`/finance/fee-structures?${params.toString()}`, "GET"),
  });
};
