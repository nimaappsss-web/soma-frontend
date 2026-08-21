import { db, type BroadcastStatusCache } from "../../../db/db";
import type { BroadcastStatusResponse } from "../types";

/** Stable Dexie key for a class-scoped broadcast status record. */
export const scopeKey = (classId: string, term: string, session: string) =>
  `${classId}:${term}:${session}`;

interface CachedStatusRow {
  id: string;
  session: string;
  status: BroadcastStatusResponse;
}

/**
 * Reads the cached broadcast status for a class + term regardless of the stored
 * session (the server resolves the current session, so the caller may not know
 * it). Returns the row's id/session too so mutations can update it in place.
 */
export const getCachedStatus = async (
  userId: string,
  classId: string,
  term: string,
): Promise<CachedStatusRow | null> => {
  const rows = await db.broadcastStatus
    .where("userId")
    .equals(userId)
    .filter((r) => r.classId === classId && r.term === term)
    .toArray();
  if (rows.length === 0) return null;
  const row = rows[0];
  try {
    return { id: row.id, session: row.session, status: JSON.parse(row.statusJson) };
  } catch {
    return null;
  }
};

export const saveCachedStatus = async (
  userId: string,
  classId: string,
  term: string,
  session: string,
  status: BroadcastStatusResponse,
) => {
  const cacheRow: BroadcastStatusCache = {
    id: scopeKey(classId, term, session),
    userId,
    classId,
    term,
    session,
    statusJson: JSON.stringify(status),
    updatedAt: Date.now(),
  };
  await db.broadcastStatus.put(cacheRow);
};

/** Updates the existing cached status row in place, preserving its id/session. */
export const updateCachedStatus = async (
  userId: string,
  classId: string,
  term: string,
  status: BroadcastStatusResponse,
) => {
  const row = await getCachedStatus(userId, classId, term);
  if (!row) return;
  await db.broadcastStatus.put({
    id: row.id,
    userId,
    classId,
    term,
    session: row.session,
    statusJson: JSON.stringify(status),
    updatedAt: Date.now(),
  });
};

/** True when a broadcast write for this user's scope is still waiting to sync. */
export const hasPendingBroadcastWrite = async (userId: string) => {
  const count = await db.syncQueue
    .where("userId")
    .equals(userId)
    .filter(
      (i) =>
        i.status === "pending" &&
        (i.table === "broadcastStatus" || i.table === "examSheetBroadcastList"),
    )
    .count();
  return count > 0;
};