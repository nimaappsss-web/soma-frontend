import { db } from "../../../db/db";

export const dateSnapshotKey = (date: string, classId?: string) =>
  classId ? `date:${date}:${classId}` : `date:${date}`;
export const summarySnapshotKey = (date: string, classId?: string) =>
  classId ? `summary:${date}:${classId}` : `summary:${date}`;
export const monthSnapshotKey = (month: number, year: number, classId?: string) =>
  classId
    ? `month:${year}-${String(month + 1).padStart(2, "0")}:${classId}`
    : `month:${year}-${String(month + 1).padStart(2, "0")}`;

export const readSnapshot = async <T>(key: string) => {
  const row = await db.attendanceSnapshots.get(key);
  return row ? (row.data as T) : undefined;
};

export const writeSnapshot = async (key: string, data: unknown) => {
  await db.attendanceSnapshots.put({ key, data, savedAt: Date.now() });
};

export const readMostRecentDateSnapshot = async () => {
  const all = await db.attendanceSnapshots.toArray();
  const dated = all.filter((s) => s.key.startsWith("date:"));
  dated.sort((a, b) => b.savedAt - a.savedAt);
  return dated[0];
};

export const readMostRecentSummarySnapshot = async () => {
  const all = await db.attendanceSnapshots.toArray();
  const summaries = all.filter((s) => s.key.startsWith("summary:"));
  summaries.sort((a, b) => b.savedAt - a.savedAt);
  return summaries[0];
};

export const readMostRecentMonthSnapshot = async () => {
  const all = await db.attendanceSnapshots.toArray();
  const months = all.filter((s) => s.key.startsWith("month:"));
  months.sort((a, b) => b.savedAt - a.savedAt);
  return months[0];
};
