import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { StaffListResponse, AxiosErrorResponse } from "../types";

export const useStaffList = (page = 1, limit = 20) => {
  return useQuery<StaffListResponse, AxiosErrorResponse>({
    queryKey: staffKeys.list(page),
    queryFn: () => fetchData(`/staff?page=${page}&limit=${limit}`, "GET"),
  });
};
