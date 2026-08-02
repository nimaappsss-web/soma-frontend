import { db, type ExamActiveSummaryCache } from "../../../db/db";

export interface ActiveExamSummaryDto {
  examKey: string | null;
  subjectId: string;
  subjectName: string;
  classId: string | null;
  className: string | null;
  componentId: string | null;
  componentName: string | null;
  type: string;
  maxScore: number;
  term: string;
  session: string | null;
  scoreCount: number;
  updatedAt: string;
}

export interface ActiveExamSummariesResponse {
  exams: ActiveExamSummaryDto[];
  total: number;
}

/**
 * Caches the server's active (scored) assessment summaries for offline use.
 * These are card-level rows (names + counts) only — individual student scores
 * are fetched separately when an assessment is opened for scoring.
 *
 * When `scopeClassId` is provided, only that class's cached summaries are
 * replaced; otherwise the whole user's list is rewritten.
 */
export const seedActiveExamSummaries = async (
  userId: string,
  exams: ActiveExamSummaryDto[],
  scopeClassId?: string,
) => {
  const rows: ExamActiveSummaryCache[] = [];
  for (const exam of exams) {
    if (!exam.examKey || !exam.subjectId || !exam.classId || !exam.componentId) continue;
    rows.push({
      id: exam.examKey,
      userId,
      examKey: exam.examKey,
      subjectId: exam.subjectId,
      subjectName: exam.subjectName,
      classId: exam.classId,
      className: exam.className,
      componentId: exam.componentId,
      componentName: exam.componentName,
      type: exam.type,
      maxScore: exam.maxScore,
      term: exam.term,
      session: exam.session ?? "",
      scoreCount: exam.scoreCount,
      updatedAt: new Date(exam.updatedAt).getTime(),
    });
  }

  await db.transaction("rw", db.examActiveSummaries, async () => {
    if (scopeClassId) {
      await db.examActiveSummaries
        .where("classId")
        .equals(scopeClassId)
        .filter((s) => s.userId === userId)
        .delete();
    } else {
      await db.examActiveSummaries.where("userId").equals(userId).delete();
    }
    if (rows.length) {
      await db.examActiveSummaries.bulkPut(rows);
    }
  });
};
