import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { UploadResponse, AxiosErrorResponse } from "../types";

export const useUploadImage = () => {
  return useMutation<UploadResponse, AxiosErrorResponse, FormData>({
    mutationFn: (formData) => fetchData("/upload", "POST", formData, undefined, "multipart/form-data"),
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
