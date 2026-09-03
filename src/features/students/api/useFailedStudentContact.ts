import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";

export interface FailedStudentContact {
  error: string;
  method: string;
}

/**
 * Derives a student's parent-contact rejection from the sync queue.
 *
 * In an offline-first app, a rejected write (e.g. the parent email belongs to
 * an existing account) stays in syncQueue as a `failed` item with its
 * `lastError`. This hook surfaces that so the UI can prompt the user to fix it.
 *
 * Returns null while the write is pending/successful, and the rejection error
 * once the server has actually rejected it.
 */
export const useFailedStudentContact = (id: string): FailedStudentContact | null | undefined => {
  const { user } = useAuth();

  return useLiveQuery(
    async () => {
      if (!id || !user?.id) return null;
      const item = await db.syncQueue
        .where("userId")
        .equals(user.id)
        .filter((i) => i.table === "students" && i.recordId === id && i.status === "failed")
        .first();
      if (!item?.lastError) return null;
      return { error: item.lastError, method: item.method };
    },
    [id, user?.id],
  );
};
