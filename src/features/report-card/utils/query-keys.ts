export const reportCardKeys = {
  all: ["report-card"] as const,
  settings: () => [...reportCardKeys.all, "settings"] as const,
};
