import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { useActiveTerm } from "../../calendar/api";
import { examKeys } from "../utils/query-keys";
import { seedTermResults } from "../utils/termResultsCache";
import type { TermResultsResponse, AxiosErrorResponse } from "../types";

interface UseTermResultsParams {
  classId: string;
  term?: string;
  session?: string;
}

/**
 * Offline-first read of a class's term results. Instant read from the cached
 * document (db.examTermResults) via Dexie liveQuery, with a background fetch of
 * /results/term that refreshes the cache.
 */
export const useTermResults = ({ classId, term, session }: UseTermResultsParams) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;
  const resolvedSession = session ?? "";

  const cacheKey =
    userId && classId && resolvedTerm
      ? `${userId}:${classId}:${resolvedTerm}:${resolvedSession}`
      : "";

  const cached = useLiveQuery(
    async () => {
      if (!cacheKey) return undefined as TermResultsResponse | undefined;
      const row = await db.examTermResults.get(cacheKey);
      return row ? (JSON.parse(row.resultsJson) as TermResultsResponse) : undefined;
    },
    [cacheKey],
  );

  const query = useQuery<TermResultsResponse, AxiosErrorResponse>({
    queryKey: examKeys.results(classId, resolvedTerm ?? "", resolvedSession),
    queryFn: async () => {
      const res = await fetchData<TermResultsResponse>(
        `/results/term?classId=${classId}&term=${resolvedTerm}&session=${encodeURIComponent(resolvedSession)}`,
        "GET",
      );
      await seedTermResults(userId, classId, resolvedTerm ?? "", resolvedSession, res);
      return res;
    },
    enabled: !!userId && !!classId && !!resolvedTerm,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: cached !== undefined ? cached : query.data,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
