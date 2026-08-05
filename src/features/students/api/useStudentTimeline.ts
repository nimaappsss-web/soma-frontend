import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { useActiveTerm } from "../../calendar/api/useActiveTerm";
import { useSchoolSettings } from "../../settings/api/useSchoolSettings";
import type { StudentTimeline, TimelineEvent } from "../types";

export const useStudentTimeline = ({
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
      const record = await db.studentTimeline
        .where("id")
        .equals(cacheKey)
        .first();
      if (!record) return undefined;
      try {
        return JSON.parse(record.eventsJson) as TimelineEvent[];
      } catch {
        return undefined;
      }
    },
    [cacheKey, userId, studentId],
  );

  const query = useQuery<StudentTimeline, Error>({
    queryKey: ["studentTimeline", studentId],
    queryFn: async () => {
      const url = `/students/${studentId}/timeline`;
      const res = await fetchData<StudentTimeline>(url, "GET");

      const timeline = res.events ?? [];

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "studentTimeline" && i.status === "pending")
        .count();

      await db.transaction("rw", db.studentTimeline, async () => {
        if (hasPending === 0) {
          await db.studentTimeline.where("id").equals(cacheKey).delete();
        }
        if (timeline.length > 0) {
          await db.studentTimeline.put({
            id: cacheKey,
            userId,
            studentId,
            eventsJson: JSON.stringify(timeline),
            createdAt: Date.now(),
          });
        }
      });

      return res;
    },
    enabled: !!userId && !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  const queryTimeline = query.data?.events ?? [];
  const isEmpty = (cached ?? []).length === 0;

  return {
    timeline: cached !== undefined ? cached : queryTimeline,
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};
