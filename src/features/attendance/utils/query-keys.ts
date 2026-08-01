export const attendanceKeys = {
  all: ["attendance"] as const,
  today: (date: string) => [...attendanceKeys.all, "today", date] as const,
  calendar: (month: number, year: number) => [...attendanceKeys.all, "calendar", String(month), String(year)] as const,
};
