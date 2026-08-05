import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { useActiveTerm } from "../../calendar/api/useActiveTerm";
import { useSchoolSettings } from "../../settings/api/useSchoolSettings";
import type { StudentAcademics } from "../types";

export const useStudentAcademics = ({
  studentId,
  term,
  session,
}: {
  studentId: string;
  term?: string;
  session?: string;
}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { activeTerm } = useActiveTerm();
  const { data: settings } = useSchoolSettings();
  const activeTermName = term ?? activeTerm?.term ?? undefined;
  const activeSession = session ?? settings?.find((s) => s.key === "currentSession")?.value as string | undefined ?? undefined;

  const cacheKey = [userId, studentId, activeTermName, activeSession]
    .filter(Boolean)
    .join("-");

  const cached = useLiveQuery(
    async () => {
      if (!userId || !studentId) return undefined;
      const record = await db.studentAcademics
        .where("id")
        .equals(cacheKey)
        .first();
      if (!record) return undefined;
      try {
        return JSON.parse(record.dataJson) as StudentAcademics;
      } catch {
        return undefined;
      }
    },
    [cacheKey, userId, studentId],
  );

  const query = useQuery<StudentAcademics, Error>({
    queryKey: ["studentAcademics", studentId, activeTermName, activeSession],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTermName) params.append("term", activeTermName);
      if (activeSession) params.append("session", activeSession);
      const qs = params.toString();
      const url = `/students/${studentId}/academics${qs ? `?${qs}` : ""}`;
      const res = await fetchData<StudentAcademics>(url, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) => i.table === "studentAcademics" && i.status === "pending",
        )
        .count();

      await db.transaction("rw", db.studentAcademics, async () => {
        if (hasPending === 0) {
          await db.studentAcademics.where("id").equals(cacheKey).delete();
        }
        await db.studentAcademics.put({
          id: cacheKey,
          userId,
          studentId,
          term: activeTermName ?? "",
          session: activeSession ?? "",
          dataJson: JSON.stringify(res),
          createdAt: Date.now(),
        });
      });

      return res;
    },
    enabled: !!userId && !!studentId && !!activeTermName,
    staleTime: 5 * 60 * 1000,
  });

  const queryData = query.data;

  return {
    academics: cached ?? queryData,
    isLoading: cached === undefined && query.isLoading,
    error: query.error ?? undefined,
  };
};
