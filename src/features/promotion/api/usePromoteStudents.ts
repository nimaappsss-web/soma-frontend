import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../../../utils/toast";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { studentKeys } from "../../students/utils/query-keys";
import { classKeys } from "../../principal/utils/query-keys";
import { promotionKeys } from "../utils/query-keys";
import type {
  PromoteStudentsPayload,
  PromoteStudentsResponse,
  AxiosErrorResponse,
} from "../types";

export const usePromoteStudents = () => {
  const queryClient = useQueryClient();

  return useMutation<PromoteStudentsResponse, AxiosErrorResponse, PromoteStudentsPayload>({
    mutationFn: (payload) => fetchData("/students/promote", "POST", payload),
    onSuccess: async (result) => {
      toast.success(
        `Promoted ${result.promoted} ${result.promoted === 1 ? "student" : "students"}${
          result.graduated ? `, graduated ${result.graduated}` : ""
        }`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: promotionKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: studentKeys.details() }),
        queryClient.invalidateQueries({ queryKey: classKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: classKeys.details() }),
      ]);
    },
    onError: (error) => toast.error(transformError(error)),
  });
};
