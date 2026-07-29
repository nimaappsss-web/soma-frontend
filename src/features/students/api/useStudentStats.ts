import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import type { StudentStats, AxiosErrorResponse } from "../types";

export const useStudentStats = () => {
  return useQuery<StudentStats, AxiosErrorResponse>({
    queryKey: [...studentKeys.all, "stats"],
    queryFn: () => fetchData("/students/stats", "GET"),
  });
};
