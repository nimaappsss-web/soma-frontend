import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { Payment, RecordPaymentPayload, AxiosErrorResponse } from "../../finance/types";

export const useSubmitParentPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<Payment, AxiosErrorResponse, RecordPaymentPayload>({
    mutationFn: (payload) => fetchData("/finance/payments", "POST", { ...payload, status: "PENDING" }),
    onSuccess: async () => {
      toast.success("Payment sent! Waiting for the school to confirm.");
      await queryClient.invalidateQueries({ queryKey: ["parentFees"] });
      await queryClient.invalidateQueries({ queryKey: ["parentProfile"] });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};