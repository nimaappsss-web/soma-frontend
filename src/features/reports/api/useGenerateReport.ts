import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { reportKeys } from "../utils/query-keys";
import type { GenerateReportPayload, GenerateReportResponse, AxiosErrorResponse } from "../types";

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<GenerateReportResponse, AxiosErrorResponse, GenerateReportPayload>({
    mutationFn: (payload) => fetchData("/reports/generate", "POST", payload),
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
