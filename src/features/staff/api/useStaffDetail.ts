import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { staffKeys } from "../utils/query-keys";
import type { StaffMember, AxiosErrorResponse } from "../types";

export const useStaffDetail = (id: string) => {
  return useQuery<StaffMember, AxiosErrorResponse>({
    queryKey: staffKeys.detail(id),
    queryFn: () => fetchData(`/staff/${id}`, "GET"),
    enabled: !!id,
  });
};
