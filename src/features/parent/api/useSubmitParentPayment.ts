import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type { Payment, RecordPaymentPayload, AxiosErrorResponse } from "../../finance/types";

export const useSubmitParentPayment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Payment, AxiosErrorResponse, RecordPaymentPayload>({
    mutationFn: (payload) => fetchData("/finance/payments", "POST", { ...payload, status: "PENDING" }),
    onSuccess: async () => {
      toast.success("Payment sent! Waiting for the school to confirm.");
      queryClient.invalidateQueries({ queryKey: ["parentFees", "invoices", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["parentFees", "payments", user?.id] });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};