import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";
import type { SchoolSetting } from "../types";

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
  const data = useLiveQuery(
    () => db.schoolSettings.get(CACHE_ID),
    [],
  );

  const settings = parseSettings(data?.settingsJson);

  return {
    data: settings,
    isLoading: data === undefined,
    error: undefined,
  };
};
