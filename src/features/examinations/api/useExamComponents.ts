import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import type { ExamScheme, AxiosErrorResponse } from "../types";

export const useExamComponents = (term: string, session?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const sessionKey = session ?? "";

  const params = new URLSearchParams();
  if (term) params.set("term", term);
  if (session) params.set("session", session);

  const schemeId = `${userId}:${term}:${sessionKey}`;

  const cached = useLiveQuery(
    () => {
      if (!userId || !term) return Promise.resolve(undefined as ExamScheme | undefined);
      return db.examScheme
        .get(schemeId)
        .then((row) => (row ? (JSON.parse(row.schemeJson) as ExamScheme) : undefined));
    },
    [schemeId, userId, term],
  );

  const query = useQuery<ExamScheme, AxiosErrorResponse>({
    queryKey: examKeys.scheme({ term, session: sessionKey }),
    queryFn: async () => {
      const res = await fetchData<ExamScheme>(`/exams/components?${params.toString()}`, "GET");
      await db.examScheme.put({
        id: schemeId,
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
