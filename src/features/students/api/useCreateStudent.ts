import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { CreateStudentPayload, Student, AxiosErrorResponse } from "../types";

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation<Student, AxiosErrorResponse, CreateStudentPayload>({
    mutationFn: (payload) => fetchData("/students", "POST", payload),
    onSuccess: async () => {
      toast.success("Student added!");
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
