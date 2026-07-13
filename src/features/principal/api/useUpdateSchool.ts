import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import type { AxiosErrorResponse } from "../types";

interface UpdateSchoolPayload {
  name?: string;
  schoolCode?: string;
  admissionPattern?: string;
  state?: string;
  lga?: string;
  schoolType?: string;
  address?: string;
  logo?: string;
  arms?: string[];
}

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosErrorResponse, UpdateSchoolPayload>({
    mutationFn: (payload) => fetchData("/school", "PATCH", payload),
    onSuccess: async () => {
      toast.success("School updated!");
      queryClient.invalidateQueries({ queryKey: ["school"] });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
