export const broadcastKeys = {
  all: ["broadcast"] as const,
  status: (classId: string, term: string, session: string) =>
    [...broadcastKeys.all, "status", classId, term, session] as const,
  sheetBroadcasts: (status?: string) =>
    [...broadcastKeys.all, "sheet-broadcasts", status ?? "all"] as const,
};