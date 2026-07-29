export const calendarKeys = {
  all: ["calendar"] as const,
  events: () => [...calendarKeys.all, "events"] as const,
  event: (id: string) => [...calendarKeys.all, "events", id] as const,
  holidays: () => [...calendarKeys.all, "holidays"] as const,
  terms: () => [...calendarKeys.all, "terms"] as const,
  term: (id: string) => [...calendarKeys.all, "terms", id] as const,
};
