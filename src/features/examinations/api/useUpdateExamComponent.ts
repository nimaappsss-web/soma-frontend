import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type {
  UpdateExamComponentPayload,
  ComponentMutationResponse,
  ExamSchemesResponse,
  ExamSchemeInfo,
  AxiosErrorResponse,
} from "../types";

interface UpdateComponentInput {
  id: string;
  data: UpdateExamComponentPayload;
  term: string;
  session?: string;
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

export const useUpdateExamComponent = () => {
  const { user } = useAuth();

  return useMutation<ComponentMutationResponse, AxiosErrorResponse, UpdateComponentInput>({
    mutationFn: async ({ id, data, term, session: sessionArg }) => {
      const userId = user?.id ?? "";
      const session = sessionArg ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      let updatedScheme: ExamSchemeInfo | undefined;

      const updatedSchemes = (prev?.schemes ?? []).map((s) => {
        const updated = recalcScheme({
          ...s,
          components: s.components.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        });
        if (updated.components.some((c) => c.id === id)) {
          updatedScheme = updated;
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
        method: "PATCH",
        payload: data,
      });

      const scheme = updatedScheme!;
      const component = scheme.components.find((c) => c.id === id)!;
      return {
        component,
        schemeTotal: scheme.schemeTotal,
        complete: scheme.complete,
        warning: scheme.warning,
      };
    },
    onSuccess: async () => {
      toast.success("Component updated!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
