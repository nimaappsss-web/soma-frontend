export const examKeys = {
  all: ["exam"] as const,
  lists: () => [...examKeys.all, "list"] as const,
  list: (params: Record<string, string>) => [...examKeys.all, "list", ...Object.values(params)] as const,
  details: () => [...examKeys.all, "detail"] as const,
  detail: (id: string) => [...examKeys.all, "detail", id] as const,
  scheme: (params: Record<string, string>) => [...examKeys.all, "scheme", ...Object.values(params)] as const,
  schemes: () => [...examKeys.all, "scheme"] as const,
  scores: (examId: string) => [...examKeys.all, "scores", examId] as const,
  active: (scope = "") => [...examKeys.all, "active", scope] as const,
  studentScore: (examId: string, studentId: string) => [...examKeys.all, "student-score", examId, studentId] as const,
  results: (classId: string, term: string, session: string) => ["results", classId, term, session] as const,
  studentReport: (studentId: string, term: string) => [...examKeys.all, "student-report", studentId, term] as const,
};
