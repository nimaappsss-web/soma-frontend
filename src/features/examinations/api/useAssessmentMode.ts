import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import type { AssessmentMode } from "../types";

const isAssessmentMode = (value: unknown): value is AssessmentMode =>
  value === "thirdTermAverage" || value === "standard";

export const useAssessmentMode = () => {
  const { user } = useAuth();

  const records = useLiveQuery(
    async () => {
      if (!user?.id) return [];
      return db.schoolSettings.toArray();
    },
    [user?.id],
  );

  let mode: AssessmentMode = "thirdTermAverage";
  for (const rec of records ?? []) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rec.settingsJson);
    } catch {
      continue;
    }
    if (Array.isArray(parsed)) {
      const setting = parsed.find(
        (s) =>
          s &&
          typeof s === "object" &&
          "key" in s &&
          (s.key === "assessmentMode" || s.key === "thirdTermAverage"),
      );
      if (setting && "value" in setting && isAssessmentMode(setting.value)) {
        mode = setting.value;
        break;
      }
    } else if (parsed && typeof parsed === "object" && "assessmentMode" in parsed) {
      const value = (parsed as Record<string, unknown>).assessmentMode;
      if (isAssessmentMode(value)) {
        mode = value;
        break;
      }
    }
  }

  return { mode, isLoading: records === undefined };
};
