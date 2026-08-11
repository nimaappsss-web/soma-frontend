export const classSubjectKeys = {
  all: ["class-subjects"] as const,
  lists: () => [...classSubjectKeys.all, "list"] as const,
  list: (schoolId?: string) => [...classSubjectKeys.all, "list", schoolId ?? ""] as const,
};