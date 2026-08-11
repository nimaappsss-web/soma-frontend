export const timetableKeys = {
  all: ["timetable"] as const,
  lists: () => [...timetableKeys.all, "list"] as const,
  list: (classId: string, day?: string) =>
    [...timetableKeys.all, "list", classId, day].filter(Boolean) as readonly string[],
  details: () => [...timetableKeys.all, "detail"] as const,
  detail: (id: string) => [...timetableKeys.all, "detail", id] as const,
  build: (classId: string) => [...timetableKeys.all, "build", classId] as const,
  teacher: (teacherId: string) => [...timetableKeys.all, "teacher", teacherId] as const,
};