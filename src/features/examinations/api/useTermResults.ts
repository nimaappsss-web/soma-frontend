import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { examKeys } from "../utils/query-keys";
import type { TermResultsResponse, AxiosErrorResponse } from "../types";

interface UseTermResultsParams {
  classId: string;
  term?: string;
  session?: string;
}

export const useTermResults = ({ classId, term, session }: UseTermResultsParams) => {
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  return useQuery<TermResultsResponse, AxiosErrorResponse>({
    queryKey: examKeys.results(classId, resolvedTerm ?? "", session ?? ""),
    queryFn: () => fetchData(`/results/term?classId=${classId}&term=${resolvedTerm}&session=${session ? encodeURIComponent(session) : ""}`, "GET"),
    enabled: !!classId && !!resolvedTerm,
  });
};
