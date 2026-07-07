import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { TeachersResponse } from "../types";

export const useTeachers = () => {
  return useQuery<TeachersResponse>({
    queryKey: principalKeys.teachers(),
    queryFn: () => fetchData("/teachers", "GET"),
  });
};
