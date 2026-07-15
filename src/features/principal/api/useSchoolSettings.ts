import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";

export interface SchoolSetting {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "pattern" | "multi-select" | "array";
  value: string | string[] | null;
  options?: string[];
  category: string;
  editable: boolean;
  editableReason?: string;
}

export const useSchoolSettings = () => {
  return useQuery<SchoolSetting[]>({
    queryKey: ["schoolSettings"],
    queryFn: () => fetchData("/school/settings"),
  });
};
