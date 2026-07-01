import type { AxiosInstance } from "axios";
import Axios from "axios";

import { tokenStorage, refreshTokenStorage, storage } from "../utils/storage";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const port = "3000";
    return hostname === "localhost" || hostname === "127.0.0.1"
      ? import.meta.env.VITE_API_BASE_URL || `http://localhost:${port}/api`
      : `http://${hostname}:${port}/api`;
  }
  return import.meta.env.VITE_API_BASE_URL || `http://localhost:3000/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export const axiosInstance = Axios.create({
  baseURL: API_BASE_URL,
  // withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = refreshTokenStorage.getRefreshToken();

    if (!refreshToken) {
      // No refresh token available, clear storage and redirect to login
      isRefreshing = false;
      storage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      // Call refresh token endpoint
      const response = await Axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { baseURL: API_BASE_URL },
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens in storage
      tokenStorage.setToken(accessToken);
      if (newRefreshToken) {
        refreshTokenStorage.setRefreshToken(newRefreshToken);
      }

      // Update axios default header
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh token failed, clear storage and redirect to login
      processQueue(refreshError, null);
      storage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const setAxiosDefaultToken = (
  token: string,
  axiosInstance: AxiosInstance,
) => {
  localStorage.setItem("token", token);
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const deleteAxiosDefaultToken = () => {
  delete axiosInstance.defaults.headers.common["Authorization"];
};
