import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type { CreateScoreSchemePayload, ExamSchemeInfo, ExamSchemesResponse, AxiosErrorResponse } from "../types";

const genId = () => crypto.randomUUID();

export const useCreateExamScheme = () => {
  const { user } = useAuth();

  return useMutation<ExamSchemeInfo, AxiosErrorResponse, CreateScoreSchemePayload>({
    mutationFn: async (payload) => {
      const userId = user?.id ?? "";
      const term = payload.term;
      const session = payload.session ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;
      const id = genId();

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      const newScheme: ExamSchemeInfo = {
        schemeId: id,
        schoolTypes: payload.schoolTypes,
        components: [],
        schemeTotal: 0,
        complete: false,
        warning: null,
      };

      const updated: ExamSchemesResponse = {
        term,
        session: prev?.session ?? session,
        schemes: [...(prev?.schemes ?? []), newScheme],
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
        endpoint: "/exams/schemes",
        method: "POST",
        payload: { ...payload, id },
      });

      return newScheme;
    },
    onSuccess: async () => {
      toast.success("Configuration created!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
