import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { reportCardKeys } from "../utils/query-keys";
import { seedReportSettings } from "../utils/reportCardCache";
import type { ReportSettings, AxiosErrorResponse } from "../types";

export const useUpdateReportSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ReportSettings, AxiosErrorResponse, Partial<ReportSettings>>({
    mutationFn: (payload) => fetchData("/report-settings", "PUT", payload),
    onSuccess: async (data) => {
      if (user) await seedReportSettings(user.id, data);
      queryClient.invalidateQueries({ queryKey: reportCardKeys.settings() });
      toast.success("Report card design saved");
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};
