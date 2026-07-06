import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";

export interface Class {
  id: string;
  name: string;
}

export const useClasses = () => {
  return useQuery<Class[]>({
    queryKey: principalKeys.classes(),
    queryFn: () => fetchData("/classes", "GET"),
  });
};
