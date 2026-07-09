export const principalKeys = {
  all: ["principal"] as const,
  lists: () => [...principalKeys.all, "list"] as const,
  list: (id: string) => [...principalKeys.all, "list", id] as const,
  details: () => [...principalKeys.all, "detail"] as const,
  detail: (id: string) => [...principalKeys.details(), id] as const,
  subjectLists: () => [...principalKeys.all, "subjects", "list"] as const,
};
