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
import { fetchData } from "../utils/fetchData";
import { useAuth } from "./AuthContext";

interface SyncContextType {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number;
  lastSyncedAt: string | null;
  triggerSync: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

const POLL_INTERVAL = 30000;
const FLUSH_INTERVAL = 60000;
const MAX_RETRIES = 3;

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const flushingRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    if (!user) { setPendingCount(0); setFailedCount(0); return; }
    const [pending, failed] = await Promise.all([
      db.syncQueue.where("userId").equals(user.id).filter((i) => i.status === "pending").count(),
      db.syncQueue.where("userId").equals(user.id).filter((i) => i.status === "failed").count(),
    ]);
    setPendingCount(pending);
    setFailedCount(failed);
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
    setIsSyncing(true);

    try {
      const pending = await db.syncQueue
        .where("userId")
        .equals(user.id)
        .filter((i) => i.status === "pending" || i.status === "failed")
        .toArray();

      const total = pending.length;
      setSyncTotal(total);
      setSyncProgress(0);

      for (const item of pending) {
        await db.syncQueue.update(item.id!, { status: "syncing" });

        try {
          await fetchData(item.endpoint, item.method, item.payload as Record<string, unknown>);
          await db.syncQueue.update(item.id!, { status: "synced" });
          setPendingCount((c) => Math.max(0, c - 1));
        } catch {
          const nextRetry = item.retryCount + 1;
          if (nextRetry >= MAX_RETRIES) {
            await db.syncQueue.update(item.id!, { status: "failed" });
            setFailedCount((c) => c + 1);
            setPendingCount((c) => Math.max(0, c - 1));
          } else {
            await db.syncQueue.update(item.id!, { retryCount: nextRetry, status: "pending" });
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

  return (
    <SyncContext value={{ pendingCount, failedCount, isSyncing, syncProgress, syncTotal, lastSyncedAt, triggerSync }}>
      {children}
    </SyncContext>
  );
};

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
};
