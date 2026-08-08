import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import type { DeleteSchemePayload, ExamSchemesResponse, AxiosErrorResponse } from "../types";

interface DeleteSchemeResponse {
  message: string;
  session: string;
  schemes: Array<{
    schemeId: string;
    schoolTypes: string[];
    schemeTotal: number;
    complete: boolean;
    warning: string | null;
  }>;
}

export const useDeleteExamScheme = () => {
  const { user } = useAuth();

  return useMutation<DeleteSchemeResponse, AxiosErrorResponse, DeleteSchemePayload>({
    mutationFn: async ({ id, term, session: sessionArg }) => {
      const userId = user?.id ?? "";
      const session = sessionArg ?? "";
      const cacheId = `${userId}:${term}:${session}:all`;

      const existing = await db.examScheme.get(cacheId);
      const prev: ExamSchemesResponse | undefined = existing
        ? JSON.parse(existing.schemeJson)
        : undefined;

      const updated: ExamSchemesResponse = {
        term,
        session: prev?.session ?? session,
        schemes: (prev?.schemes ?? []).filter((s) => s.schemeId !== id),
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
        method: "DELETE",
        payload: null,
      });

      return { message: "Deleted", session: updated.session, schemes: [] };
    },
    onSuccess: async () => {
      toast.success("Configuration deleted!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
