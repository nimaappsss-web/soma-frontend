import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { needsInitialSync, performSync, type SyncProgress } from "./syncService";

interface InitialSyncContextType {
  isInitialSyncing: boolean;
  syncProgress: SyncProgress | null;
}

const InitialSyncContext = createContext<InitialSyncContextType>({
  isInitialSyncing: false,
  syncProgress: null,
});

export const useInitialSync = () => useContext(InitialSyncContext);

export const InitialSyncProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.emailVerified === false) return;
    if (user.hasSchool === false) return;

    let cancelled = false;

    const run = async () => {
      const needsSync = await needsInitialSync();
      if (!needsSync || cancelled) return;

      setIsInitialSyncing(true);
      try {
        await performSync(user, (progress) => {
          if (!cancelled) setSyncProgress(progress);
        });
      } finally {
        if (!cancelled) {
          setIsInitialSyncing(false);
          setSyncProgress(null);
        }
      }
    };

    run();

    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  return (
    <InitialSyncContext value={{ isInitialSyncing, syncProgress }}>
      {isInitialSyncing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Syncing your data...</p>
            {syncProgress && (
              <div className="w-full space-y-1">
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {syncProgress.table} ({syncProgress.current}/{syncProgress.total})
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </InitialSyncContext>
  );
};
