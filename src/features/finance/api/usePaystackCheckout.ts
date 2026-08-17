import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

export interface PaystackCheckoutPayload {
  invoiceId: string;
  amount: number;
}

export interface PaystackCheckoutResponse {
  authorizationUrl: string;
  reference: string;
  surcharge: number;
  total: number;
}

export const usePaystackCheckout = () => {
  return useMutation<
    PaystackCheckoutResponse,
    AxiosErrorResponse,
    PaystackCheckoutPayload
  >({
    mutationFn: (payload) => fetchData("/finance/paystack/checkout", "POST", payload),
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};