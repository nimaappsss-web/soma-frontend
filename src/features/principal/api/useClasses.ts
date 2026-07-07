import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";

export interface Class {
  id: string;
  name: string;
  level: string;
  arm?: string;
}

export interface ClassesResponse {
  classes: Class[];
  levels: string[];
}

export const useClasses = () => {
  return useQuery<ClassesResponse>({
    queryKey: principalKeys.classes(),
    queryFn: () => fetchData("/classes", "GET"),
  });
};
