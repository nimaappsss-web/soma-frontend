import { useCallback, useState } from "react";
import type { WizardDraft } from "../types";

const keyFor = (classId: string) => `soma_timetable_draft_${classId}`;

const readDraft = (classId: string): WizardDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(classId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WizardDraft;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.schedule)) return null;
    if (parsed.step !== undefined && !Number.isFinite(parsed.step)) return null;
    return {
      step: parsed.step ?? 0,
      title: typeof parsed.title === "string" ? parsed.title : "",
      schedule: parsed.schedule ?? [],
      selectedSubjects: parsed.selectedSubjects ?? [],
      targets: parsed.targets ?? {},
      doublePeriods: parsed.doublePeriods ?? [],
    };
  } catch {
    return null;
  }
};

/**
 * localStorage draft for the timetable wizard (key: `soma_timetable_draft_<classId>`).
 * Persists every change; cleared after a successful publish.
 */
export const useTimetableDraft = (classId: string) => {
  const [draft, setDraft] = useState<WizardDraft | null>(() => readDraft(classId));

  const save = useCallback(
    (next: WizardDraft | null) => {
      setDraft(next);
      if (typeof window === "undefined") return;
      if (next) {
        window.localStorage.setItem(keyFor(classId), JSON.stringify(next));
      } else {
        window.localStorage.removeItem(keyFor(classId));
      }
    },
    [classId],
  );

  const clear = useCallback(() => save(null), [save]);

  return { draft, save, clear };
};