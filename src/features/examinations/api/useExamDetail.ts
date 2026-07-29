import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { examKeys } from "../utils/query-keys";
import type { Exam, AxiosErrorResponse } from "../types";

export const useExamDetail = (id: string) => {
  return useQuery<Exam, AxiosErrorResponse>({
    queryKey: examKeys.detail(id),
    queryFn: () => fetchData(`/exams/${id}`, "GET"),
    enabled: !!id,
  });
};
