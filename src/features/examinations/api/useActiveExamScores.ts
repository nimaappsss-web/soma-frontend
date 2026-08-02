import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import { seedActiveExamSummaries, type ActiveExamSummariesResponse } from "../utils/activeSummaries";
import type { AxiosErrorResponse } from "../types";

export interface ActiveAssessmentCard {
  examKey: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string | null;
  componentId: string;
  componentName: string | null;
  componentType: string;
  maxScore: number;
  term: string;
  count: number;
  latest: number;
  rosterCount: number;
}

/**
 * Offline-first read of active assessments. Instant read from the cached card
 * summaries (db.examActiveSummaries) via Dexie liveQuery, with a background
 * fetch of /assessments/active-scores that refreshes the cache. When `classId`
 * is provided the fetch is scoped via ?classId= and only that class's cache is
 * replaced — matching the class filter dropdown.
 */
export const useActiveExamScores = (classId?: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    async () => {
      if (!userId) return undefined as ActiveAssessmentCard[] | undefined;
      const summaries = classId
        ? await db.examActiveSummaries
            .where("classId")
            .equals(classId)
            .filter((s) => s.userId === userId)
            .toArray()
        : await db.examActiveSummaries.where("userId").equals(userId).toArray();

      const cards: ActiveAssessmentCard[] = [];
      for (const s of summaries) {
        const rosterCount = await db.students
          .where("classId")
          .equals(s.classId)
          .filter((st) => st.status === "ACTIVE")
          .count();
        cards.push({
          examKey: s.examKey,
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          classId: s.classId,
          className: s.className,
          componentId: s.componentId,
          componentName: s.componentName,
          componentType: s.type,
          maxScore: s.maxScore,
          term: s.term,
          count: s.scoreCount,
          latest: s.updatedAt,
          rosterCount,
        });
      }

      cards.sort((a, b) => b.latest - a.latest);
      return cards;
    },
    [userId, classId],
  );

  const query = useQuery<ActiveExamSummariesResponse, AxiosErrorResponse>({
    queryKey: examKeys.active(classId ?? ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      const qs = params.toString();
      const res = await fetchData<ActiveExamSummariesResponse>(
        `/assessments/active-scores${qs ? `?${qs}` : ""}`,
        "GET",
      );
      await seedActiveExamSummaries(userId, res?.exams ?? [], classId);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isEmpty = (cached ?? []).length === 0;

  return {
    data: cached ?? [],
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};
