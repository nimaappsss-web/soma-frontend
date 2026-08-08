import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type {
  CreateExamComponentPayload,
  ComponentMutationResponse,
  ExamSchemesResponse,
  ExamSchemeInfo,
  AxiosErrorResponse,
} from "../types";

const genId = () => crypto.randomUUID();

const recalcScheme = (scheme: ExamSchemeInfo): ExamSchemeInfo => {
  const schemeTotal = scheme.components.reduce((sum, c) => sum + c.maxScore, 0);
  const complete = schemeTotal === 100;
  const warning = schemeTotal > 100
    ? `Total exceeds 100 by ${schemeTotal - 100}.`
    : schemeTotal < 100
      ? `${100 - schemeTotal} marks remaining.`
      : null;
  return { ...scheme, schemeTotal, complete, warning };
};

export const useCreateExamComponent = () => {
  const { user } = useAuth();

  return useMutation<ComponentMutationResponse, AxiosErrorResponse, CreateExamComponentPayload>({
    mutationFn: async (payload) => {
      const userId = user?.id ?? "";
      const term = payload.term;
      const session = payload.session ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;
      const componentId = genId();

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      const newComponent = {
        id: componentId,
        name: payload.name,
        type: payload.type,
        maxScore: payload.maxScore,
        sortOrder: payload.sortOrder,
      };

      const updatedSchemes = (prev?.schemes ?? []).map((s) => {
        if (s.schemeId !== payload.schemeId) return s;
        return recalcScheme({
          ...s,
          components: [...s.components, newComponent],
        });
      });

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
        recordId: componentId,
        endpoint: "/exams/components",
        method: "POST",
        payload: { ...payload, id: componentId },
      });

      const scheme = updatedSchemes.find((s) => s.schemeId === payload.schemeId)!;
      return {
        component: newComponent,
        schemeTotal: scheme.schemeTotal,
        complete: scheme.complete,
        warning: scheme.warning,
      };
    },
    onSuccess: async () => {
      toast.success("Component added!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
