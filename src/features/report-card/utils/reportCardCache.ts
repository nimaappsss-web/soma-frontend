import { db, type ReportSettingsCache } from "../../../db/db";
import type { ReportSettings } from "../types";

export const REPORT_SETTINGS_CACHE_ID = "default";

export const seedReportSettings = async (userId: string, settings: ReportSettings) => {
  const row: ReportSettingsCache = {
    id: REPORT_SETTINGS_CACHE_ID,
    userId,
    template: settings.template,
    theme: settings.theme,
    updatedAt: Date.now(),
  };
  await db.reportSettings.put(row);
};
