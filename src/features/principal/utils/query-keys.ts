export const principalKeys = {
  all: ["principal"] as const,
  lists: () => [...principalKeys.all, "list"] as const,
  list: (id: string) => [...principalKeys.all, "list", id] as const,
  details: () => [...principalKeys.all, "detail"] as const,
  detail: (id: string) => [...principalKeys.details(), id] as const,
};

export const subjectKeys = {
  all: ["subject"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
  list: (id: string) => [...subjectKeys.all, "list", id] as const,
  details: () => [...subjectKeys.all, "detail"] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
};

export const classKeys = {
  all: ["class"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (id: string) => [...classKeys.all, "list", id] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
};

export const parentKeys = {
  all: ["parent"] as const,
  lists: () => [...parentKeys.all, "list"] as const,
  list: (page: number) => [...parentKeys.all, "list", String(page)] as const,
  details: () => [...parentKeys.all, "detail"] as const,
  detail: (id: string) => [...parentKeys.details(), id] as const,
};
