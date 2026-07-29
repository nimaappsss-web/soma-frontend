export const analyticsKeys = {
  all: ["analytics"] as const,
  attendance: (date: string) => [...analyticsKeys.all, "attendance", date] as const,
  calendar: (month: number, year: number, classId?: string) =>
    [...analyticsKeys.all, "calendar", String(month), String(year), classId].filter(Boolean) as readonly string[],
};
