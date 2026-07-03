import type { AxiosInstance } from "axios";
import Axios from "axios";

import { tokenStorage, storage } from "../utils/storage";

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
});

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
  (error) => {
    const url = error.config?.url ?? "";
    if (
      error.response?.status === 401 &&
      !error.config._retry &&
      !url.startsWith("/auth/")
    ) {
      error.config._retry = true;
      storage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
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
