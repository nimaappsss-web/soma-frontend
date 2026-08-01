import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import { examScoreKey } from "./useExamScoresLocal";
import type { GetScoresBulkResponse, ScoresBulkScope, AxiosErrorResponse } from "../types";

export const useExamScoresBulk = (scope: ScoresBulkScope) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const examKey = examScoreKey(scope);

  const params = new URLSearchParams();
  params.set("subjectId", scope.subjectId);
  params.set("classId", scope.classId);
  params.set("componentId", scope.componentId);
  params.set("term", scope.term);
  if (scope.session) params.set("session", scope.session);

  return useQuery<GetScoresBulkResponse, AxiosErrorResponse>({
    queryKey: examKeys.scores(examKey),
    queryFn: async () => {
      const res = await fetchData<GetScoresBulkResponse>(`/exams/scores?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) =>
            i.table === "examScores" &&
            i.recordId === `${userId}:${examKey}` &&
            (i.status === "pending" || i.status === "failed"),
        )
        .count();

      await db.transaction("rw", db.examScores, async () => {
        if (hasPending === 0) {
          await db.examScores.where("examKey").equals(examKey).delete();
          if (res.scores?.length) {
            await db.examScores.bulkPut(
              res.scores.map((s: { studentId: string; score: number; remarks: string | null }) => ({
                id: `${userId}:${examKey}:${s.studentId}`,
                userId,
                examKey,
                subjectId: scope.subjectId,
                classId: scope.classId,
                componentId: scope.componentId,
                term: scope.term,
                session: scope.session ?? "",
                studentId: s.studentId,
                studentName: "",
                score: Number(s.score),
                remarks: s.remarks ?? null,
                syncStatus: "synced",
                updatedAt: Date.now(),
              })),
            );
          }
        }
      });

      return res;
    },
    enabled:
      !!userId &&
      !!scope.subjectId &&
      !!scope.classId &&
      !!scope.componentId &&
      !!scope.term,
    staleTime: 5 * 60 * 1000,
  });
};
