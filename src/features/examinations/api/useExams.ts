import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";

import { fetchData } from "../../../utils/fetchData";
import { db } from "../../../db/db";
import { useActiveTerm } from "../../calendar/api";
import { useAuth } from "../../../contexts/AuthContext";
import { examKeys } from "../utils/query-keys";
import type { ExamListResponse, Exam, AxiosErrorResponse } from "../types";
import type { ExamCache } from "../../../db/db";

interface UseExamsParams {
  term?: string;
  session?: string;
  subjectId?: string;
  classId?: string;
  page?: number;
  limit?: number;
}

const toCache = (exam: Exam, userId: string): ExamCache => ({
  id: exam.id,
  userId,
  name: exam.name,
  type: exam.type,
  subjectId: exam.subjectId,
  subjectName: exam.subjectName,
  classId: exam.classId,
  className: exam.className,
  componentId: exam.componentId ?? null,
  componentName: exam.componentName ?? null,
  term: exam.term,
  session: exam.session,
  maxScore: exam.maxScore,
  date: exam.date,
  status: exam.status,
  scoreCount: exam.scoreCount ?? 0,
});

const fromCache = (row: ExamCache): Exam => ({
  id: row.id,
  name: row.name,
  type: row.type as Exam["type"],
  subjectId: row.subjectId,
  subjectName: row.subjectName,
  classId: row.classId,
  className: row.className,
  componentId: row.componentId,
  componentName: row.componentName,
  term: row.term,
  session: row.session,
  maxScore: row.maxScore,
  date: row.date,
  status: row.status as Exam["status"],
  scoreCount: row.scoreCount,
});
export const useExams = ({ term, session, subjectId, classId, page, limit }: UseExamsParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { activeTerm } = useActiveTerm();
  const resolvedTerm = term ?? activeTerm?.term;

  const params = new URLSearchParams();
  if (resolvedTerm) params.set("term", resolvedTerm);
  if (session) params.set("session", session);
  if (subjectId) params.set("subjectId", subjectId);
  if (classId) params.set("classId", classId);
  if (page && page > 1) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const cached = useLiveQuery(
    async () => {
      if (!userId || !resolvedTerm) return Promise.resolve(undefined);
      let rows = await db.exams
        .where("userId")
        .equals(userId)
        .filter((e) => e.term === resolvedTerm)
        .toArray();
      if (classId) rows = rows.filter((e) => e.classId === classId);
      if (subjectId) rows = rows.filter((e) => e.subjectId === subjectId);
      return rows.sort((a, b) => b.date.localeCompare(a.date));
    },
    [userId, resolvedTerm, classId, subjectId],
  );

  const query = useQuery<ExamListResponse, AxiosErrorResponse>({
    queryKey: examKeys.list({
      term: resolvedTerm ?? "",
      session: session ?? "",
      subjectId: subjectId ?? "",
      classId: classId ?? "",
      page: String(page ?? 1),
    }),
    queryFn: async () => {
      const res = await fetchData<ExamListResponse>(`/exams?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "exams" && (i.status === "pending" || i.status === "failed"))
        .count();

      const isDefaultView = !classId && !subjectId && (!page || page === 1);

      await db.transaction("rw", db.exams, async () => {
        if (hasPending === 0 && isDefaultView) {
          await db.exams.where("userId").equals(userId).delete();
        }
        if (res.exams?.length) {
          await db.exams.bulkPut(res.exams.map((e: Exam) => toCache(e, userId)));
        }
      });

      return res;
    },
    enabled: !!resolvedTerm && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cachedExams = (cached ?? []).map(fromCache);
  const isEmpty = (cached ?? []).length === 0;

  return {
    data: cached !== undefined ? { exams: cachedExams, total: cachedExams.length, page: 1, totalPages: 1 } : query.data,
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};
