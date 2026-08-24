export const promotionKeys = {
  all: ["promotion"] as const,
  lists: () => [...promotionKeys.all, "list"] as const,
  list: (id: string) => [...promotionKeys.all, "list", id] as const,
  details: () => [...promotionKeys.all, "detail"] as const,
  detail: (id: string) => [...promotionKeys.details(), id] as const,
};
