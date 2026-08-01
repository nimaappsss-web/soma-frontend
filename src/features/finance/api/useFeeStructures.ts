import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { financeKeys } from "../utils/query-keys";
import type { FeeStructureListResponse, AxiosErrorResponse } from "../types";

interface UseFeeStructuresParams {
  classId?: string;
  term?: string;
  session?: string;
}

export const useFeeStructures = ({ classId, term, session }: UseFeeStructuresParams = {}) => {
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  const params = new URLSearchParams();
  if (classId) params.set("classId", classId);
  if (resolvedTerm) params.set("term", resolvedTerm);
  if (session) params.set("session", session);

  return useQuery<FeeStructureListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.feeStructures(), classId, resolvedTerm, session].filter(Boolean),
    queryFn: () => fetchData(`/finance/fee-structures?${params.toString()}`, "GET"),
  });
};
