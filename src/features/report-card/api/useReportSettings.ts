import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { reportCardKeys } from "../utils/query-keys";
import { seedReportSettings, REPORT_SETTINGS_CACHE_ID } from "../utils/reportCardCache";
import type { ReportSettings, AxiosErrorResponse } from "../types";

const DEFAULTS: ReportSettings = { template: "classic", theme: "slate" };

/**
 * Offline-first read of the school-wide report card design. Reads the cached
 * design (db.reportSettings) instantly via Dexie liveQuery, with a background
 * fetch of /report-settings that refreshes the cache.
 */
export const useReportSettings = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    async () => {
      if (!userId) return undefined as ReportSettings | undefined;
      const row = await db.reportSettings.get(REPORT_SETTINGS_CACHE_ID);
      return row && row.userId === userId
        ? { template: row.template as ReportSettings["template"], theme: row.theme as ReportSettings["theme"] }
        : undefined;
    },
    [userId],
  );

  const query = useQuery<ReportSettings, AxiosErrorResponse>({
    queryKey: reportCardKeys.settings(),
    queryFn: async () => {
      const res = await fetchData<ReportSettings>("/report-settings", "GET");
      await seedReportSettings(userId, res);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const resolved: ReportSettings = cached !== undefined ? cached : (query.data ?? DEFAULTS);

  return {
    settings: resolved,
    data: resolved,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
