import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { useExamComponents } from "./useExamComponents";
import type { ExamScheme } from "../types";
import type { SubjectAssignment } from "../../teacher/types";

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder;

export const useClassTermComponents = (term: string, formClassId?: string | null) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  // Offline-first schoolType resolution — no network required.
  // 1. classes cache → 2. teaching assignments cache (classes carry schoolType).
  const schoolTypeQuery = useLiveQuery(async () => {
    if (!userId || !formClassId) return "";
    const cls = await db.classes.get(formClassId);
    if (cls?.schoolType) return cls.schoolType;
    const row = await db.teacherAssignments.get(userId);
    if (row?.assignmentsJson) {
      try {
        const assignments = JSON.parse(row.assignmentsJson) as SubjectAssignment[];
        for (const assignment of assignments) {
          const match = assignment.classes.find((c) => c.id === formClassId);
          if (match?.schoolType) return match.schoolType;
        }
      } catch {
        // malformed cache — fall through
      }
    }
    return "";
  }, [userId, formClassId]);

  const schoolType = schoolTypeQuery ?? "";
  const { data: schemeData } = useExamComponents(term, undefined, schoolType);

  // Fallback when the class's schoolType can't be resolved locally:
  // reuse the latest scheme already cached for this term (e.g., cached by Mark Scores).
  const cachedSchemeQuery = useLiveQuery(async () => {
    if (!userId || !term || schoolTypeQuery === undefined || schoolType) return undefined;
    const rows = await db.examScheme.where("userId").equals(userId).toArray();
    const matches = rows.filter((r) => r.term === term);
    if (matches.length === 0) return undefined;
    const latest = matches.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    try {
      return JSON.parse(latest.schemeJson) as ExamScheme;
    } catch {
      return undefined;
    }
  }, [userId, term, schoolType, schoolTypeQuery]);

  const components = useMemo(
    () => [...(schemeData?.components ?? cachedSchemeQuery?.components ?? [])].sort(bySortOrder),
    [schemeData, cachedSchemeQuery],
  );

  return { components };
};
