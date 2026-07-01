import { axiosInstance } from "../lib/axios";

import type { LoginRequest, RegisterPrincipalRequest, RegisterSchoolRequest, VerifyOTPRequest, LoginResponse, User } from "../features/auth/types";

type RefreshResponse = { accessToken: string; refreshToken: string };

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  registerPrincipal: (data: RegisterPrincipalRequest) =>
    axiosInstance.post("/auth/register-principal", data).then((r) => r.data),

  sendOTP: (phone: string) =>
    axiosInstance.post<{ message: string; expiresIn: number }>("/auth/send-otp", { phone }).then((r) => r.data),

  verifyOTP: (data: VerifyOTPRequest) =>
    axiosInstance.post("/auth/verify-otp", data).then((r) => r.data),

  registerSchool: (data: RegisterSchoolRequest) =>
    axiosInstance.post("/auth/register-school", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<RefreshResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    axiosInstance.post<{ message: string }>("/auth/logout", { refreshToken }).then((r) => r.data),

  me: () => axiosInstance.get<User>("/auth/me").then((r) => r.data),
};
