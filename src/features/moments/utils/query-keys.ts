export const momentsKeys = {
  all: ["moments"] as const,
  celebrations: () => [...momentsKeys.all, "celebrations"] as const,
};
