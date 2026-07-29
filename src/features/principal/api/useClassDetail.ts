import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { classKeys } from "../utils/query-keys";
import type { ClassDetailResponse, AxiosErrorResponse } from "../types";

export const useClassDetail = (id: string) => {
  return useQuery<ClassDetailResponse, AxiosErrorResponse>({
    queryKey: classKeys.detail(id),
    queryFn: () => fetchData(`/classes/${id}`, "GET"),
    enabled: !!id,
  });
};
