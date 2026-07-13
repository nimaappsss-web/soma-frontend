import { useSync } from "../contexts/SyncContext";

export const SyncIndicator = () => {
  const { pendingCount, failedCount, isSyncing, syncProgress, syncTotal, lastSyncedAt, triggerSync } = useSync();

  const hasIssues = pendingCount > 0 || failedCount > 0;
  const percent = syncTotal > 0 ? Math.round((syncProgress / syncTotal) * 100) : 0;

  return (
    <button
      onClick={triggerSync}
      disabled={isSyncing || pendingCount === 0}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all ${
        failedCount > 0
          ? "bg-red-500 text-white"
          : isSyncing
            ? "bg-blue-500 text-white"
            : hasIssues
              ? "bg-amber-500 text-white"
              : "bg-gray-700/60 text-white"
      }`}
      title={lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Not synced yet"}
    >
      {isSyncing ? (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{percent}%</span>
          <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : failedCount > 0 ? (
        <span>{failedCount} failed</span>
      ) : pendingCount > 0 ? (
        <span>{pendingCount} pending</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
};
