import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type {
  DeleteComponentPayload,
  ExamSchemesResponse,
  ExamSchemeInfo,
  AxiosErrorResponse,
} from "../types";

interface DeleteComponentResponse {
  message: string;
  schemeTotal: number;
  complete: boolean;
  warning: string | null;
}

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

export const useDeleteExamComponent = () => {
  const { user } = useAuth();

  return useMutation<DeleteComponentResponse, AxiosErrorResponse, DeleteComponentPayload>({
    mutationFn: async ({ id, term, session: sessionArg }) => {
      const userId = user?.id ?? "";
      const session = sessionArg ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      let affectedScheme: ExamSchemeInfo | undefined;

      const updatedSchemes = (prev?.schemes ?? []).map((s) => {
        const updated = recalcScheme({
          ...s,
          components: s.components.filter((c) => c.id !== id),
        });
        if (s.components.some((c) => c.id === id)) {
          affectedScheme = updated;
        }
        return updated;
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
        recordId: id,
        endpoint: `/exams/components/${id}`,
        method: "DELETE",
        payload: null,
      });

      return {
        message: "Removed",
        schemeTotal: affectedScheme?.schemeTotal ?? 0,
        complete: affectedScheme?.complete ?? false,
        warning: affectedScheme?.warning ?? null,
      };
    },
    onSuccess: async () => {
      toast.success("Component removed!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
