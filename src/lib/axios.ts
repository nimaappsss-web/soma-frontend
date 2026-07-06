import type { AxiosInstance } from "axios";
import Axios from "axios";

import { tokenStorage, refreshTokenStorage, storage } from "../utils/storage";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const port = "3000";
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return import.meta.env.VITE_API_BASE_URL || `http://localhost:${port}/api`;
    }
    return import.meta.env.VITE_API_BASE_URL || `https://${hostname}/api`;
  }
  return import.meta.env.VITE_API_BASE_URL || `http://localhost:3000/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export const axiosInstance = Axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url ?? "";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !url.startsWith("/auth/")
    ) {
      const refreshToken = refreshTokenStorage.get();
      if (!refreshToken) {
        storage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await Axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.accessToken;
        tokenStorage.setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        processQueue(error, null);
        storage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export const setAxiosDefaultToken = (
  token: string,
  instance: AxiosInstance,
) => {
  localStorage.setItem("token", token);
  instance.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const deleteAxiosDefaultToken = () => {
  delete axiosInstance.defaults.headers.common["Authorization"];
};
