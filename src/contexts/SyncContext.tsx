import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

import { db } from "../db/db";
import type { SyncQueueItem } from "../db/db";
import { fetchData } from "../utils/fetchData";
import { transformError } from "../utils/transformError";
import { useAuth } from "./AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { attendanceKeys } from "../features/teacher/utils/query-keys";

interface SyncContextType {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number;
  lastSyncedAt: string | null;
  triggerSync: () => void;
  clearFailed: () => void;
  retryItem: (id: number) => Promise<void>;
  discardItem: (id: number) => Promise<void>;
  failedItems: SyncQueueItem[];
}

const SyncContext = createContext<SyncContextType | null>(null);

const POLL_INTERVAL = 10000;
const FLUSH_INTERVAL = 15000;
const MAX_RETRIES = 3;
const FAILED_TTL = 7 * 24 * 60 * 60 * 1000;
const BACKOFF_BASE_MS = 15_000;
const BACKOFF_CAP_MS = 30 * 60 * 1000;

const isTransientError = (error: unknown): boolean => {
  const axiosError = error as { response?: { status?: number } };
  const status = axiosError?.response?.status;
  if (!status) return true;
  return status >= 500 || status === 408 || status === 429;
};

const nextBackoff = (attempt: number): number => {
  const delay = BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1);
  return Math.min(delay, BACKOFF_CAP_MS);
};

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const flushingRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    if (!user) { setPendingCount(0); setFailedCount(0); setFailedItems([]); return; }
    const [pending, failed, failedRows] = await Promise.all([
      db.syncQueue.where("userId").equals(user.id).filter((i) => i.status === "pending").count(),
      db.syncQueue.where("userId").equals(user.id).filter((i) => i.status === "failed").count(),
      db.syncQueue.where("userId").equals(user.id).filter((i) => i.status === "failed").sortBy("createdAt"),
    ]);
    setPendingCount(pending);
    setFailedCount(failed);
    setFailedItems(failedRows.reverse());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refreshCounts();
    const interval = setInterval(refreshCounts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, refreshCounts]);

  const flush = useCallback(async () => {
    if (!user || flushingRef.current) return;
    flushingRef.current = true;

    try {
      const now = Date.now();
      const due = await db.syncQueue
        .where("userId")
        .equals(user.id)
        .filter(
          (i) => i.status === "pending" && (i.nextAttemptAt ?? 0) <= now,
        )
        .sortBy("createdAt");

      const total = due.length;
      if (total === 0) {
        setLastSyncedAt(new Date().toISOString());
        return;
      }

      setIsSyncing(true);
      setSyncTotal(total);
      setSyncProgress(0);

      for (const item of due) {
        await db.syncQueue.update(item.id!, { status: "syncing", lastAttemptAt: Date.now() });

        try {
          const response = await fetchData(item.endpoint, item.method, item.payload as Record<string, unknown>);

          if (item.endpoint === "/students/bulk" && response && typeof response === "object" && "failed" in response) {
            const failed = (response as { failed: Array<{ index: number; reason: string }> }).failed;
            if (failed?.length) {
              const students = (item.payload as { students: Array<{ id: string }> }).students;
              for (const f of failed) {
                if (students[f.index]?.id) {
                  await db.students.delete(students[f.index].id);
                }
              }
            }
          } else if (item.method === "POST" || item.method === "PUT") {
            const table = db[item.table as keyof typeof db] as any;
            if (table && response && typeof response === "object" && "id" in response) {
              // Keep the client-generated id as the record's identity. The id was
              // sent to the backend in the payload (and the backend stores under it),
              // so never replace it with a server id or delete the temp record.
              // This keeps deletes/updates targeting the same id the backend holds.
              await table.put({ ...response, id: item.recordId, userId: item.userId });
            }
          }

          await db.syncQueue.delete(item.id!);
          setPendingCount((c) => Math.max(0, c - 1));

          if (item.table === "attendance") {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
          }
        } catch (error) {
          // A DELETE that 404s is already done on the server — treat as success.
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (item.method === "DELETE" && status === 404) {
            await db.syncQueue.delete(item.id!);
            setPendingCount((c) => Math.max(0, c - 1));
            continue;
          }

          const nextRetry = item.retryCount + 1;
          const errorMessage = transformError(error);

          if (isTransientError(error) && nextRetry < MAX_RETRIES) {
            await db.syncQueue.update(item.id!, {
              retryCount: nextRetry,
              status: "pending",
              lastError: errorMessage,
              nextAttemptAt: Date.now() + nextBackoff(nextRetry),
            });
          } else {
            await db.syncQueue.update(item.id!, {
              status: "failed",
              lastError: errorMessage,
            });
            setFailedCount((c) => c + 1);
            setPendingCount((c) => Math.max(0, c - 1));
          }
        }

        setSyncProgress((prev) => prev + 1);
      }

      setLastSyncedAt(new Date().toISOString());
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
      setSyncTotal(0);
      flushingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const onOnline = () => flush();
    window.addEventListener("online", onOnline);

    const interval = setInterval(flush, FLUSH_INTERVAL);

    flush();

    return () => {
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
  }, [user, flush]);

  const triggerSync = useCallback(() => { flush(); }, [flush]);

  const clearFailed = useCallback(async () => {
    if (!user) return;
    await db.syncQueue.where({ userId: user.id, status: "failed" }).delete();
    setFailedCount(0);
    setFailedItems([]);
  }, [user]);

  const retryItem = useCallback(async (id: number) => {
    await db.syncQueue.update(id, {
      status: "pending",
      retryCount: 0,
      lastError: undefined,
      nextAttemptAt: undefined,
    });
    setFailedCount((c) => Math.max(0, c - 1));
    setFailedItems((items) => items.filter((i) => i.id !== id));
    flush();
  }, [flush]);

  const discardItem = useCallback(async (id: number) => {
    await db.syncQueue.delete(id);
    setFailedCount((c) => Math.max(0, c - 1));
    setFailedItems((items) => items.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    if (!user) return;
    const pruneFailed = async () => {
      const cutoff = Date.now() - FAILED_TTL;
      const stale = await db.syncQueue
        .where("userId")
        .equals(user.id)
        .filter((i) => i.status === "failed" && i.createdAt < cutoff)
        .toArray();
      if (stale.length) {
        await db.syncQueue.bulkDelete(stale.map((i) => i.id!));
        refreshCounts();
      }
    };
    pruneFailed();
    const ttlInterval = setInterval(pruneFailed, 6 * 60 * 60 * 1000);
    return () => clearInterval(ttlInterval);
  }, [user, refreshCounts]);

  return (
    <SyncContext value={{ pendingCount, failedCount, failedItems, isSyncing, syncProgress, syncTotal, lastSyncedAt, triggerSync, clearFailed, retryItem, discardItem }}>
      {children}
    </SyncContext>
  );
};

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
};
