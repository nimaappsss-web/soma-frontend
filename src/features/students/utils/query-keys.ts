export const studentKeys = {
  all: ["student"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (id: string) => [...studentKeys.all, "list", id] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};
