import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";

export interface Subject {
  id: string;
  name: string;
}

export const useSubjects = () => {
  return useQuery<Subject[]>({
    queryKey: principalKeys.subjects(),
    queryFn: () => fetchData("/subjects", "GET"),
  });
};
