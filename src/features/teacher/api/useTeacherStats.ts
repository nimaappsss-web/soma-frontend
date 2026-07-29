import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import type { TeacherStats, AxiosErrorResponse } from "../types";

export const useTeacherStats = () => {
  return useQuery<TeacherStats, AxiosErrorResponse>({
    queryKey: [...teacherKeys.all, "stats"],
    queryFn: () => fetchData("/teachers/stats", "GET"),
  });
};
