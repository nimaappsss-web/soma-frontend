export const teacherKeys = {
  all: ["teacher"] as const,
  lists: () => [...teacherKeys.all, "list"] as const,
  list: (id: string) => [...teacherKeys.all, "list", id] as const,
  details: () => [...teacherKeys.all, "detail"] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
};

export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (classId: string, date: string) =>
    [...attendanceKeys.all, "list", classId, date] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (studentId: string) =>
    [...attendanceKeys.all, "detail", studentId] as const,
};
