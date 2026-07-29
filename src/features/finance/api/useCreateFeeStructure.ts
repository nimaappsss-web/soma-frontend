import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { CreateFeeStructurePayload, FeeStructure, AxiosErrorResponse } from "../types";

export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();

  return useMutation<FeeStructure, AxiosErrorResponse, CreateFeeStructurePayload>({
    mutationFn: (payload) => fetchData("/finance/fee-structures", "POST", payload),
    onSuccess: async () => {
      toast.success("Fee structure added!");
      queryClient.invalidateQueries({ queryKey: financeKeys.feeStructures() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
