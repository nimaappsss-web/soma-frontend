import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type {
  CopySchemePayload,
  CopySchemeResponse,
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

export const useCopyExamComponents = () => {
  const { user } = useAuth();

  return useMutation<CopySchemeResponse, AxiosErrorResponse, CopySchemePayload>({
    mutationFn: async (payload) => {
      const userId = user?.id ?? "";
      const term = payload.term;
      const session = payload.session ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      const copiedComponents = (prev?.schemes ?? []).flatMap((s) =>
        s.components.map((c) => ({ ...c, id: genId() })),
      );

      const updatedSchemes = (prev?.schemes ?? []).map((s) =>
        recalcScheme({ ...s, components: copiedComponents.filter(() => true) }),
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
        recordId: `copy_${term}_${Date.now()}`,
        endpoint: "/exams/components/copy",
        method: "POST",
        payload,
      });

      const scheme = updatedSchemes[0];
      return {
        message: "Copied",
        session: updated.session,
        components: scheme?.components ?? [],
        schemeTotal: scheme?.schemeTotal ?? 0,
        complete: scheme?.complete ?? false,
        warning: scheme?.warning ?? null,
      };
    },
    onSuccess: async () => {
      toast.success("Previous scheme copied!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
