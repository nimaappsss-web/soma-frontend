export const announcementKeys = {
  all: ["announcement"] as const,
  lists: () => [...announcementKeys.all, "list"] as const,
  list: (page: number) => [...announcementKeys.all, "list", String(page)] as const,
  details: () => [...announcementKeys.all, "detail"] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
};
