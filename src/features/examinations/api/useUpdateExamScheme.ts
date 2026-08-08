import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type { UpdateSchemePayload, ExamSchemeInfo, ExamSchemesResponse, AxiosErrorResponse } from "../types";

export const useUpdateExamScheme = () => {
  const { user } = useAuth();

  return useMutation<ExamSchemeInfo, AxiosErrorResponse, UpdateSchemePayload>({
    mutationFn: async ({ id, schoolTypes, term, session: sessionArg }) => {
      const userId = user?.id ?? "";
      const session = sessionArg ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      const updatedSchemes = (prev?.schemes ?? []).map((s) =>
        s.schemeId === id ? { ...s, schoolTypes } : s,
      );

      const updated: ExamSchemesResponse = {
        term,
        session: prev?.session ?? session,
        schemes: updatedSchemes,
      };

      await db.examScheme.put({
        id: cacheId,
        userId,
        term,
        session: updated.session,
        schemeJson: JSON.stringify(updated),
        updatedAt: Date.now(),
      });

      await addToQueue({
        userId,
        table: "examScheme",
        recordId: id,
        endpoint: `/exams/schemes/${id}`,
        method: "PATCH",
        payload: { schoolTypes },
      });

      return updatedSchemes.find((s) => s.schemeId === id)!;
    },
    onSuccess: async () => {
      toast.success("Configuration updated!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
