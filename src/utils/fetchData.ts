import { axiosInstance } from "../lib/axios";
import { METHOD } from "./constants";

export const fetchData = async <T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "GET" | "DELETE" = "GET",
  payload?: T,
  accept: string = "application/json",
  contentType: string = "application/json"
) => {
  const { POST, PUT, GET, DELETE, PATCH } = METHOD;

  const headers = {
    Accept: accept,
    "Content-Type": contentType,
  };

  try {
    if (method === POST) {
      const { data } = await axiosInstance.post(url, payload, { headers });
      return data;
    }
    if (method === PATCH) {
      const { data } = await axiosInstance.patch(url, payload, { headers });
      return data;
    }
    if (method === GET) {
      const { data } = await axiosInstance.get(url, { headers });
      return data;
    }
    if (method === PUT) {
      const { data } = await axiosInstance.put(url, payload, { headers });
      return data;
    }
    if (method === DELETE) {
      const { data } = await axiosInstance.delete(url, { headers });
      return data;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
