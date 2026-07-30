import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type SchoolSettingsCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import type { SchoolInfo, AxiosErrorResponse } from "../types";

export const useSchoolInfo = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve(undefined);
      return db.schoolSettings.where("id").equals("school-info").first();
    },
    [userId],
  ) as SchoolSettingsCache | undefined;

  const query = useQuery<{ school: SchoolInfo }, AxiosErrorResponse>({
    queryKey: [...principalKeys.all, "school"],
    queryFn: async () => {
      const res = await fetchData<{ school: SchoolInfo }>("/school", "GET");
      if (res.school && userId) {
        await db.schoolSettings.put({
          id: "school-info",
          userId,
          settingsJson: JSON.stringify(res.school),
          updatedAt: Date.now(),
        });
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const school = cached ? (JSON.parse(cached.settingsJson) as SchoolInfo) : undefined;

  return {
    data: school ?? query.data?.school,
    isLoading: cached === undefined || (!school && query.isLoading),
    error: query.error ?? undefined,
  };
};
