import { useMutation } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface LogoutRequest {
  refreshToken: string;
}

interface LogoutResponse {
  message: string;
}

export const useLogout = () => {
  return useMutation<LogoutResponse, AxiosErrorResponse, LogoutRequest>({
    mutationFn: (payload) => fetchData("/auth/logout", "POST", payload),
  });
};
