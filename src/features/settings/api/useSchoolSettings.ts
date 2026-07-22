import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { SchoolSetting } from "../types";

const parseSettings = (json: string | undefined): SchoolSetting[] => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const useSchoolSettings = () => {
  const { user } = useAuth();

  useQuery({
    queryKey: ["schoolSettings", user?.id],
    queryFn: async () => {
      const res = await fetchData<{ settingsJson?: string }>("/school/settings", "GET");
      if (res && user) {
        await db.schoolSettings.put({ id: "default", userId: user.id, settingsJson: JSON.stringify(res), updatedAt: Date.now() });
      }
      return res;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const data = useLiveQuery(
    async () => {
      if (!user?.id) return undefined;
      return db.schoolSettings.where({ userId: user.id }).first();
    },
    [user?.id],
  );

  const settings = data ? parseSettings(data.settingsJson) : [];

  return {
    data: settings,
    isLoading: data === undefined,
    error: undefined,
  };
};
