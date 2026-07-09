import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import type { InviteInfo } from "../../principal/types";

export const useInviteInfo = (token: string) => {
  return useQuery<InviteInfo>({
    queryKey: ["invite-info", token],
    queryFn: () => fetchData(`/auth/invite-info?token=${token}`, "GET"),
    enabled: !!token,
    staleTime: 0,
    retry: false,
  });
};
