import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import type { ExamSchemeInfo, AxiosErrorResponse } from "../types";

export interface ExamSchemesResponse {
  term: string;
  session: string;
  schemes: ExamSchemeInfo[];
}

export const useExamSchemes = (term: string, session?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const sessionKey = session ?? "";

  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (session) params.set("session", session);

  const cacheId = `${userId}:${term}:${sessionKey}:all`;

  const cached = useLiveQuery(
    () => {
      if (!userId || !term) return Promise.resolve(undefined as ExamSchemesResponse | undefined);
      return db.examScheme
        .get(cacheId)
        .then((row) => (row ? (JSON.parse(row.schemeJson) as ExamSchemesResponse) : undefined));
    },
    [cacheId, userId, term],
  );

  const query = useQuery<ExamSchemesResponse, AxiosErrorResponse>({
    queryKey: examKeys.scheme({ term, session: sessionKey, scope: "all" }),
    queryFn: async () => {
      const res = await fetchData<ExamSchemesResponse>(`/exams/components?${params.toString()}`, "GET");
      await db.examScheme.put({
        id: cacheId,
        userId,
        term,
        session: res.session || sessionKey,
        schemeJson: JSON.stringify(res),
        updatedAt: Date.now(),
      });
      return res;
    },
    enabled: !!term && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: cached !== undefined ? cached : query.data,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
