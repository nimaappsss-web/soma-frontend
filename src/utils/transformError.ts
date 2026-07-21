import type { AxiosErrorResponse } from "../features/auth/types";

export const transformError = (error: unknown): string => {
  const axiosError = error as AxiosErrorResponse;

  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError?.response?.data?.error) {
    return axiosError.response.data.error;
  }

  if (axiosError?.message === "Network Error") {
    return "Cannot reach the server. This is usually one of:\n\u2022 Backend not running on 0.0.0.0 (bound to localhost only)\n\u2022 CORS headers not configured\n\u2022 Firewall blocking the port";
  }

  return axiosError?.message || "Something went wrong";
};
