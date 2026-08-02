import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";

import { fetchData } from "../../../utils/fetchData";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import type { ExamRosterResponse, AxiosErrorResponse } from "../types";

export const useExamScores = (examId: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    async () => {
      if (!userId || !examId) return Promise.resolve(undefined);
      const row = await db.examRosters.get(examId);
      if (!row) return undefined;
      return JSON.parse(row.rosterJson) as ExamRosterResponse;
    },
    [userId, examId],
  );

  const query = useQuery<ExamRosterResponse, AxiosErrorResponse>({
    queryKey: examKeys.scores(examId),
    queryFn: async () => {
      const res = await fetchData<ExamRosterResponse>(`/exams/${examId}/scores`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) =>
            i.table === "examRosters" &&
            i.recordId.startsWith(`${userId}:${examId}:`) &&
            (i.status === "pending" || i.status === "failed"),
        )
        .count();

      if (hasPending === 0) {
        await db.examRosters.put({
          id: examId,
          userId,
          examId,
          rosterJson: JSON.stringify(res),
          updatedAt: Date.now(),
        });
      }

      return res;
    },
    enabled: !!userId && !!examId,
    staleTime: 5 * 60 * 1000,
  });

  const isEmpty = cached === undefined;

  return {
    data: cached ?? query.data,
    isLoading: isEmpty && query.isLoading,
    error: query.error ?? undefined,
  };
};
