import { useMutation } from "@tanstack/react-query";
import { fetchData } from "../../../utils/fetchData";
import type { CheckIdentifierRequest, CheckIdentifierResponse, AxiosErrorResponse } from "../types";

export const useCheckIdentifier = () => {
  return useMutation<CheckIdentifierResponse, AxiosErrorResponse, CheckIdentifierRequest>({
    mutationFn: (payload) => fetchData<CheckIdentifierRequest>("/auth/check-identifier", "POST", payload),
  });
};
