export const authKeys = {
  all: ["auth"] as const,
  lists: () => [...authKeys.all, "list"] as const,
  list: (id: string) => [...authKeys.all, "list", id] as const,
  details: () => [...authKeys.all, "detail"] as const,
  detail: (id: string) => [...authKeys.details(), id] as const,
};
