import { db, type ExamStudentReportCache } from "../../../db/db";
import type { StudentAcademicsResponse } from "../types";

export const studentReportCacheId = (userId: string, studentId: string, term: string) =>
  `${userId}:${studentId}:${term}`;

export const seedStudentReport = async (
  userId: string,
  studentId: string,
  term: string,
  session: string,
  report: StudentAcademicsResponse,
) => {
  const row: ExamStudentReportCache = {
    id: studentReportCacheId(userId, studentId, term),
    userId,
    studentId,
    term,
    session,
    reportJson: JSON.stringify(report),
    updatedAt: Date.now(),
  };
  await db.examStudentReports.put(row);
};
