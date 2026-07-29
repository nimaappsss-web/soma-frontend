import { useMutation } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, AxiosErrorResponse, RefreshTokenRequest>({
    mutationFn: (payload) => fetchData("/auth/refresh", "POST", payload),
  });
};
