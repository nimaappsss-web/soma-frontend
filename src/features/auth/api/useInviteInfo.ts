import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { authKeys } from "../utils/query-keys";
import type { InviteInfo } from "../../principal/types";

export const useInviteInfo = (token: string) => {
  return useQuery<InviteInfo>({
    queryKey: authKeys.list(token),
    queryFn: () => fetchData(`/auth/invite-info?token=${token}`, "GET"),
    enabled: !!token,
    staleTime: 0,
    retry: false,
  });
};
