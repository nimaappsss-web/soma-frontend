export const reportKeys = {
  all: ["report"] as const,
  available: () => [...reportKeys.all, "available"] as const,
  list: () => [...reportKeys.all, "list"] as const,
  history: (page: number) => [...reportKeys.all, "history", String(page)] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
  download: (id: string) => [...reportKeys.all, "download", id] as const,
};
