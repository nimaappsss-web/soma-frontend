import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { SchoolSetting, SchoolSettingsResponse } from "../types";

const parseSettings = (json: string | undefined): SchoolSetting[] => {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    // Older builds stored the whole { settings: [...] } response — unwrap it
    // so stale IndexedDB rows can't crash consumers that call .find/.map.
    if (parsed && Array.isArray((parsed as { settings?: unknown }).settings)) {
      return (parsed as { settings: SchoolSetting[] }).settings;
    }
    return [];
  } catch {
    return [];
  }
};

export const useSchoolSettings = () => {
  const { user } = useAuth();

  useQuery({
    queryKey: ["schoolSettings", user?.id],
    queryFn: async () => {
      const res = await fetchData<SchoolSettingsResponse>("/school/settings", "GET");
      if (res && user) {
        await db.schoolSettings.put({ id: "default", userId: user.id, settingsJson: JSON.stringify(res.settings), updatedAt: Date.now() });
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
