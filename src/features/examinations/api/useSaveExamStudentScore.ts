import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { db } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { useAuth } from "../../../contexts/AuthContext";
import type { ExamRosterResponse, SaveStudentScorePayload, SaveStudentScoreResponse, AxiosErrorResponse } from "../types";

export const useSaveExamStudentScore = (examId: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useMutation<
    SaveStudentScoreResponse,
    AxiosErrorResponse,
    { studentId: string; data: SaveStudentScorePayload }
  >({
    mutationFn: async ({ studentId, data }) => {
      if (!userId) throw new Error("Not authenticated");

      const existing = await db.examRosters.get(examId);

      if (existing) {
        const roster = JSON.parse(existing.rosterJson) as ExamRosterResponse;
        const target = roster.roster.find((s) => s.studentId === studentId);
        if (target) {
          target.score = data.score;
          if (data.remarks !== undefined) target.remarks = data.remarks;
        }
        await db.examRosters.put({
          id: examId,
          userId,
          examId,
          rosterJson: JSON.stringify(roster),
          updatedAt: Date.now(),
        });
      }

      await addToQueue({
        userId,
        table: "examRosters",
        recordId: `${userId}:${examId}:${studentId}`,
        endpoint: `/exams/${examId}/student/${studentId}`,
        method: "PUT",
        payload: data,
      });

      return {
        studentId,
        studentName: "",
        admissionNo: "",
        score: data.score,
        remarks: data.remarks ?? null,
      };
    },
    onSuccess: () => {},
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          "Couldn't save score",
      );
    },
  });
};
