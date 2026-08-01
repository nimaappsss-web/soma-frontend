import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { db, type ExamScoreCache } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { useAuth } from "../../../contexts/AuthContext";
import { examScoreKey } from "./useExamScoresLocal";
import type { SubmitScoresBulkPayload, SubmitScoresBulkResponse, AxiosErrorResponse } from "../types";

type SaveExamScoresInput = SubmitScoresBulkPayload & {
  studentNames: Record<string, string>;
};

export const useSaveExamScores = () => {
  const { user } = useAuth();

  return useMutation<SubmitScoresBulkResponse, AxiosErrorResponse, SaveExamScoresInput>({
    mutationFn: async ({ subjectId, classId, componentId, term, session, scores, studentNames }) => {
      const userId = user?.id ?? "";
      if (!userId) throw new Error("Not authenticated");

      const examKey = examScoreKey({ subjectId, classId, componentId, term });
      const recordId = `${userId}:${examKey}`;
      const timestamp = Date.now();

      await db.transaction("rw", db.examScores, async () => {
        await db.examScores.bulkPut(
          scores.map((s) => {
            const row: ExamScoreCache = {
              id: `${recordId}:${s.studentId}`,
              userId,
              examKey,
              subjectId,
              classId,
              componentId,
              term,
              session: session ?? "",
              studentId: s.studentId,
              studentName: studentNames[s.studentId] ?? "",
              score: Number(s.score),
              remarks: s.remarks ?? null,
              syncStatus: "pending",
              updatedAt: timestamp,
            };
            return row;
          }),
        );
      });

      await addToQueue({
        userId,
        table: "examScores",
        recordId,
        endpoint: "/exams/scores",
        method: "POST",
        payload: {
          subjectId,
          classId,
          componentId,
          term,
          session,
          scores: scores.map((s) => ({
            studentId: s.studentId,
            score: Number(s.score),
            remarks: s.remarks,
          })),
        },
      });

      return { message: "Scores saved", count: scores.length, examId: "" };
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.scores.length} score(s) saved`);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          "Couldn't save scores",
      );
    },
  });
};
