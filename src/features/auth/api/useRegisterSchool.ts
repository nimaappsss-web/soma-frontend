import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { RegisterSchoolRequest, RegisterSchoolResponse, AxiosErrorResponse } from "../types";

export const useRegisterSchool = () => {
  return useMutation<RegisterSchoolResponse, AxiosErrorResponse, RegisterSchoolRequest>({
    mutationFn: (payload) => fetchData<RegisterSchoolRequest>("/auth/register-school", "POST", payload),
    onSuccess: async () => {
      toast.success("School registered successfully!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
