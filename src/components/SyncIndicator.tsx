import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, CloseCircle, TickCircle } from "iconsax-react";
import { useSync } from "../contexts/SyncContext";
export const SyncIndicator = () => {
  const { pendingCount, failedCount, failedItems, isSyncing, syncProgress, syncTotal, lastSyncedAt, triggerSync, clearFailed, retryItem, discardItem } = useSync();
  const [open, setOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasIssues = pendingCount > 0 || failedCount > 0;
  const allSynced = !isSyncing && !hasIssues;
  const percent = syncTotal > 0 ? Math.round((syncProgress / syncTotal) * 100) : 0;

  useEffect(() => {
    if (!allSynced) {
      setShowDone(false);
      return;
    }
    setShowDone(true);
    const t = setTimeout(() => setShowDone(false), 4000);
    return () => clearTimeout(t);
  }, [allSynced]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {allSynced && !showDone ? null : (
          <motion.button
            initial={allSynced ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(!open)}
            disabled={isSyncing}
            className={`${
              allSynced
                ? "flex w-9 h-9 items-center justify-center rounded-full bg-green-500 text-white"
                : "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium text-white shadow-lg transition-all"
            } ${
              failedCount > 0
                ? "bg-red-500"
                : isSyncing
                  ? "bg-blue-500"
                  : hasIssues
                    ? "bg-amber-500"
                    : "bg-gray-700/60"
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
              <span className="flex items-center gap-1.5 font-bold">
                <CloseCircle size={16} variant="Bold" color="#FFFFFF" />
                {failedCount}
              </span>
            ) : pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={15} variant="Bold" color="#FFFFFF" />
                {pendingCount}
              </span>
            ) : (
              <TickCircle size={18} variant="Bold" color="#FFFFFF" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && failedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl border border-gray-100 shadow-lg p-3"
          >
            <p className="text-xs font-semibold text-gray-900 mb-2">{failedCount} sync{failedCount > 1 ? "s" : ""} failed</p>
            <div className="max-h-56 overflow-y-auto space-y-2 mb-3">
              {failedItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-red-100 bg-red-50/50 p-2">
                  <p className="text-[11px] font-medium text-gray-800 mb-0.5">
                    {item.method} {item.endpoint}
                  </p>
                  <p className="text-[11px] text-red-600 mb-2 break-words">
                    {item.lastError ?? "Check your connection and try again."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => retryItem(item.id!)}
                      className="flex-1 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-gray-800 transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => discardItem(item.id!)}
                      className="flex-1 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { triggerSync(); setOpen(false); }}
                className="flex-1 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Retry all
              </button>
              <button
                onClick={() => { clearFailed(); setOpen(false); }}
                className="flex-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};