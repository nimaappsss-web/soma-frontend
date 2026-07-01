export const schools = {
  all: ["schools"] as const,
  details: () => [...schools.all, "detail"] as const,
  detail: (id: string) => [...schools.details(), id] as const,
};

export const teachers = {
  all: ["teachers"] as const,
  lists: () => [...teachers.all, "list"] as const,
  list: (schoolId: string) => [...teachers.lists(), schoolId] as const,
  details: () => [...teachers.all, "detail"] as const,
  detail: (id: string) => [...teachers.details(), id] as const,
};
