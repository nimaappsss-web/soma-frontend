import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { authKeys } from "../utils/query-keys";
import type { User } from "../types";

export const useMe = () => {
  return useQuery<User>({
    queryKey: authKeys.details(),
    queryFn: () => fetchData("/auth/me", "GET"),
    staleTime: Infinity,
    retry: false,
  });
};
