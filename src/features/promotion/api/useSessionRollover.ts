import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../../../utils/toast";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { calendarKeys } from "../../calendar/utils/query-keys";
import type {
  SessionRolloverPayload,
  SessionRolloverResponse,
  AxiosErrorResponse,
} from "../types";

export const useSessionRollover = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<SessionRolloverResponse, AxiosErrorResponse, SessionRolloverPayload>({
    mutationFn: (payload) => fetchData("/academic-terms/rollover", "POST", payload),
    onSuccess: async (res) => {
      toast.success("New session dates saved");
      if (user && res.terms?.length) {
        await db.academicTerms.bulkPut(
          res.terms.map((t) => ({
            id: t.id,
            term: t.term,
            startDate: t.startDate,
            endDate: t.endDate,
            isCurrent: t.isCurrent,
            userId: user.id,
          })),
        );
      }
      await queryClient.invalidateQueries({ queryKey: calendarKeys.terms() });
    },
    onError: (error) => toast.error(transformError(error)),
  });
};
