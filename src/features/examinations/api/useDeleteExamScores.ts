import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { db } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { useAuth } from "../../../contexts/AuthContext";
import { transformError } from "../../../utils/transformError";
import { examScoreKey } from "./useExamScoresLocal";
import { examKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export interface DeleteExamScoresInput {
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  session?: string;
}

interface DeleteExamScoresResponse {
  message: string;
  count: number;
}

export const useDeleteExamScores = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<DeleteExamScoresResponse, AxiosErrorResponse, DeleteExamScoresInput>({
    mutationFn: async ({ subjectId, classId, componentId, term, session }) => {
      const userId = user?.id ?? "";
      if (!userId) throw new Error("Not authenticated");

      const examKey = examScoreKey({ subjectId, classId, componentId, term });
      const recordId = `${userId}:${examKey}`;

      await db.transaction("rw", db.examScores, db.syncQueue, async () => {
        await db.syncQueue
          .where("userId")
          .equals(userId)
          .filter(
            (i) =>
              i.table === "examScores" &&
              i.recordId === recordId &&
              (i.status === "pending" || i.status === "failed"),
          )
          .delete();

        await db.examScores.where("examKey").equals(examKey).delete();
      });

      const params = new URLSearchParams({
        subjectId,
        classId,
        componentId,
        term,
      });
      if (session) params.set("session", session);

      await addToQueue({
        userId,
        table: "examScores",
        recordId,
        endpoint: `/exams/scores?${params.toString()}`,
        method: "DELETE",
        payload: {},
      });

      return { message: "Scores deleted", count: 0 };
    },
    onSuccess: async (_data, variables) => {
      toast.success("Score session cleared");
      queryClient.invalidateQueries({ queryKey: examKeys.scores(examScoreKey(variables)) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
