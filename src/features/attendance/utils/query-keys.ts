export const attendanceKeys = {
  all: ["attendance"] as const,
  today: (date: string, classId?: string) =>
    [...attendanceKeys.all, "today", date, classId ?? "all"] as const,
  summary: (date: string, classId?: string) =>
    [...attendanceKeys.all, "summary", date, classId ?? "all"] as const,
  calendar: (month: number, year: number, classId?: string) =>
    [...attendanceKeys.all, "calendar", String(month), String(year), classId ?? "all"] as const,
  range: (from: string, to: string, classId?: string) =>
    [...attendanceKeys.all, "range", from, to, classId ?? "all"] as const,
};
