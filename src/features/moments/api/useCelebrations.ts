import { useQuery } from "@tanstack/react-query";
import { fetchData } from "../../../utils/fetchData";
import { momentsKeys } from "../utils/query-keys";
import type { CelebrationsResponse, AxiosErrorResponse } from "../types";

export const useCelebrations = () => {
  return useQuery<CelebrationsResponse, AxiosErrorResponse>({
    queryKey: momentsKeys.celebrations(),
    queryFn: () => fetchData("/celebrations", "GET"),
  });
};
