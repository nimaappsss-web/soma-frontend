import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { TermResultsResponse, AxiosErrorResponse } from "../types";

interface UseTermResultsParams {
  classId: string;
  term: string;
  session: string;
}

export const useTermResults = ({ classId, term, session }: UseTermResultsParams) => {
  return useQuery<TermResultsResponse, AxiosErrorResponse>({
    queryKey: examKeys.results(classId, term, session),
    queryFn: () => fetchData(`/results/term?classId=${classId}&term=${term}&session=${encodeURIComponent(session)}`, "GET"),
    enabled: !!classId && !!term && !!session,
  });
};
