export const principalKeys = {
  all: ["principal"] as const,
  dashboard: () => [...principalKeys.all, "dashboard"] as const,
  teachers: () => [...principalKeys.all, "teachers"] as const,
  teacherDetail: (id: string) => [...principalKeys.all, "teachers", id] as const,
  classes: () => [...principalKeys.all, "classes"] as const,
  subjects: () => [...principalKeys.all, "subjects"] as const,
  settings: () => [...principalKeys.all, "settings"] as const,
};
