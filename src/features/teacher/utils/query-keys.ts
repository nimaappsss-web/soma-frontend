export const teacherKeys = {
  all: ["teacher"] as const,
  profile: (userId: string) => [...teacherKeys.all, "profile", userId] as const,
  formClass: (userId: string) => [...teacherKeys.all, "formClass", userId] as const,
  assignments: (userId: string) => [...teacherKeys.all, "assignments", userId] as const,
};
