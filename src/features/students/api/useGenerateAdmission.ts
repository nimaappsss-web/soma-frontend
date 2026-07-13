import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";

interface GenerateAdmissionResponse {
  admissionNo: string;
}

export const useGenerateAdmission = (enabled: boolean) => {
  return useQuery<GenerateAdmissionResponse>({
    queryKey: ["generateAdmission"],
    queryFn: () => fetchData("/students/generate-admission", "GET"),
    enabled,
    staleTime: 0,
  });
};
