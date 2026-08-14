import { useLiveQuery } from "dexie-react-hooks";
import { useQueries, useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useActiveTerm } from "../../calendar/api";
import { examKeys } from "../utils/query-keys";
import { seedStudentReport, studentReportCacheId } from "../utils/studentReportCache";
import { useAssessmentMode } from "./useAssessmentMode";
import type { StudentAcademicsResponse, AxiosErrorResponse } from "../types";

const TERMS = ["first", "second", "third"] as const;

export type TermName = (typeof TERMS)[number];

export interface SessionSubjectRow {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  caTotal: number;
  examScore: number;
  total: number;
  grade: string;
  scores: never[];
  termTotals: Partial<Record<TermName, number>>;
  termCaTotals: Partial<Record<TermName, number>>;
  termExamScores: Partial<Record<TermName, number>>;
}

export interface SessionAverageReport extends Omit<StudentAcademicsResponse, "subjects" | "term"> {
  term: "session";
  subjects: SessionSubjectRow[];
}

const round1 = (value: number) => Math.round(value * 10) / 10;

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const gradeFor = (total: number) => {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
};

const buildSessionReport = (
  studentId: string,
  reports: StudentAcademicsResponse[],
): SessionAverageReport | null => {
  if (reports.length === 0) return null;

  const subjects = new Map<string, SessionSubjectRow>();

  for (const report of reports) {
    for (const subject of report.subjects) {
      const existing = subjects.get(subject.subjectId);
      if (existing) {
        existing.termTotals[report.term as TermName] = subject.total;
        existing.termCaTotals[report.term as TermName] = subject.caTotal;
        existing.termExamScores[report.term as TermName] = subject.examScore;
      } else {
        subjects.set(subject.subjectId, {
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          teacherName: subject.teacherName,
          caTotal: subject.caTotal,
          examScore: subject.examScore,
          total: subject.total,
          grade: subject.grade,
          scores: [],
          termTotals: { [report.term as TermName]: subject.total },
          termCaTotals: { [report.term as TermName]: subject.caTotal },
          termExamScores: { [report.term as TermName]: subject.examScore },
        });
      }
    }
  }

  const rows = Array.from(subjects.values()).map((subject) => {
    const values = (map: Partial<Record<TermName, number>>) =>
      Object.values(map).filter((value): value is number => typeof value === "number");
    const sessionTotal = round1(average(values(subject.termTotals)));
    return {
      ...subject,
      caTotal: round1(average(values(subject.termCaTotals))),
      examScore: round1(average(values(subject.termExamScores))),
      total: sessionTotal,
      grade: gradeFor(sessionTotal),
    };
  });

  rows.sort((a, b) => b.total - a.total);

  const best = rows.length > 0 ? rows[0] : null;
  const worst = rows.length > 0 ? rows[rows.length - 1] : null;

  return {
    studentId,
    term: "session",
    session: reports.find((report) => report.session)?.session ?? "",
    average: round1(average(reports.map((report) => report.average))),
    bestSubject: best ? { name: best.subjectName, score: best.total } : null,
    worstSubject: worst ? { name: worst.subjectName, score: worst.total } : null,
    attendancePercentage: round1(average(reports.map((report) => report.attendancePercentage))),
    position: 0,
    classSize: reports.find((report) => report.classSize > 0)?.classSize ?? 0,
    subjects: rows,
  };
};

export const useSessionAverageReport = (studentId: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { activeTerm } = useActiveTerm();
  const { mode } = useAssessmentMode();
  const isThirdTermAverage = mode === "thirdTermAverage";
  const activeTermName = activeTerm?.term ?? "";

  const cached = useLiveQuery(
    async () => {
      if (!userId || !studentId) return undefined;
      if (isThirdTermAverage) {
        const rows = await Promise.all(
          TERMS.map((term) => db.examStudentReports.get(studentReportCacheId(userId, studentId, term))),
        );
        return {
          active: undefined as StudentAcademicsResponse | undefined,
          terms: rows.map((row) =>
            row ? (JSON.parse(row.reportJson) as StudentAcademicsResponse) : undefined,
          ),
        };
      }
      const row = activeTermName
        ? await db.examStudentReports.get(studentReportCacheId(userId, studentId, activeTermName))
        : undefined;
      return {
        active: row ? (JSON.parse(row.reportJson) as StudentAcademicsResponse) : undefined,
        terms: undefined,
      };
    },
    [userId, studentId, isThirdTermAverage, activeTermName],
  );

  const activeQuery = useQuery<StudentAcademicsResponse, AxiosErrorResponse>({
    queryKey: examKeys.studentReport(studentId, activeTermName),
    queryFn: async () => {
      const res = await fetchData<StudentAcademicsResponse>(
        `/students/${studentId}/academics?term=${activeTermName}&session=`,
        "GET",
      );
      await seedStudentReport(userId, studentId, activeTermName, res.session ?? "", res);
      return res;
    },
    enabled: !isThirdTermAverage && !!userId && !!studentId && !!activeTermName,
    staleTime: 5 * 60 * 1000,
  });

  const termQueries = useQueries({
    queries: TERMS.map((term) => ({
      queryKey: examKeys.studentReport(studentId, term),
      queryFn: async () => {
        const res = await fetchData<StudentAcademicsResponse>(
          `/students/${studentId}/academics?term=${term}&session=`,
          "GET",
        );
        await seedStudentReport(userId, studentId, term, res.session ?? "", res);
        return res;
      },
      enabled: isThirdTermAverage && !!userId && !!studentId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const activeReport =
    cached?.active !== undefined ? cached.active : activeQuery.data;

  const termReports =
    cached?.terms !== undefined ? cached.terms : termQueries.map((query) => query.data);

  const availableTerms = (termReports ?? []).filter(
    (report): report is StudentAcademicsResponse => !!report && report.subjects.length > 0,
  );

  const sessionReport = isThirdTermAverage
    ? buildSessionReport(studentId, availableTerms)
    : null;

  const report = isThirdTermAverage ? sessionReport : (activeReport ?? undefined);

  const termTotals = sessionReport
    ? Object.fromEntries(
        sessionReport.subjects.map((subject) => [subject.subjectId, subject.termTotals]),
      )
    : {};

  const isLoading = isThirdTermAverage
    ? cached === undefined || (availableTerms.length === 0 && termQueries.some((query) => query.isLoading))
    : cached === undefined || (cached?.active === undefined && activeQuery.isLoading);

  const error = (isThirdTermAverage
    ? termQueries.find((query) => query.error)?.error
    : activeQuery.error) as AxiosErrorResponse | undefined;

  return {
    report,
    isThirdTermAverage,
    termTotals,
    isLoading,
    error,
  };
};
