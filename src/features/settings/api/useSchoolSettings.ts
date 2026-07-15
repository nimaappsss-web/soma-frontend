import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { db } from "../../../db/db";
import type { SchoolSettingsResponse, SchoolSetting } from "../types";

const CACHE_ID = "schoolSettings";

const parseSettings = (json: string | undefined): SchoolSetting[] => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const useSchoolSettings = () => {
  const [cached, setCached] = useState<SchoolSetting[]>([]);

  useEffect(() => {
    const sub = liveQuery(() => db.schoolSettings.get(CACHE_ID)).subscribe({
      next: (data) => setCached(parseSettings(data?.settingsJson)),
    });
    return () => sub.unsubscribe();
  }, []);

  const query = useQuery<SchoolSetting[]>({
    queryKey: ["schoolSettings"],
    queryFn: async () => {
      const res = await fetchData<SchoolSettingsResponse>("/school/settings");
      const settings = res.settings;
      await db.schoolSettings.put({
        id: CACHE_ID,
        settingsJson: JSON.stringify(settings),
        updatedAt: Date.now(),
      });
      return settings;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: cached.length > 0 ? cached : query.data ?? [],
    isLoading: query.isLoading && cached.length === 0,
    error: cached.length > 0 ? undefined : query.error,
  };
};
