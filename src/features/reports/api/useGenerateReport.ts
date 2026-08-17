import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { reportKeys } from "../utils/query-keys";
import type { GenerateReportPayload, GenerateReportResponse, AxiosErrorResponse } from "../types";

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  const { activeTerm } = useActiveTerm();

  return useMutation<GenerateReportResponse, AxiosErrorResponse, GenerateReportPayload>({
    mutationFn: (payload) => {
      const term = payload.term ?? activeTerm?.term;
      if (!term) {
        return Promise.reject(new Error("No active term — set up terms first"));
      }
      return fetchData("/reports/generate", "POST", { ...payload, term });
    },
    onSuccess: async () => {
      toast.success("Report generation started!");
      queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      queryClient.invalidateQueries({ queryKey: reportKeys.history(1) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
