export const examKeys = {
  all: ["exam"] as const,
  lists: () => [...examKeys.all, "list"] as const,
  list: (params: Record<string, string>) => [...examKeys.all, "list", ...Object.values(params)] as const,
  details: () => [...examKeys.all, "detail"] as const,
  detail: (id: string) => [...examKeys.all, "detail", id] as const,
  scores: (examId: string) => [...examKeys.all, "scores", examId] as const,
  studentScore: (examId: string, studentId: string) => [...examKeys.all, "student-score", examId, studentId] as const,
  results: (classId: string, term: string, session: string) => ["results", classId, term, session] as const,
};
