import { axiosInstance } from "../lib/axios";

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosInstance.post("/upload", formData);
  return data.url as string;
};
