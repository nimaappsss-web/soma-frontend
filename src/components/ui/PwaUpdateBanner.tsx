import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export const PwaUpdateBanner = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_, reg) => {
      if (!navigator.serviceWorker) return;
      const check = () => {
        void reg?.update().catch(() => {});
      };
      const onFocus = () => {
        check();
        window.addEventListener("focus", onFocus);
      };
      window.addEventListener("focus", onFocus);
      const timer = window.setInterval(check, 60 * 60 * 1000);
      return () => {
        window.removeEventListener("focus", onFocus);
        window.clearInterval(timer);
      };
    },
  });

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (needRefresh || offlineReady) setShow(true);
  }, [needRefresh, offlineReady]);

  if (!show) return null;

  const close = () => {
    setShow(false);
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return (
    <div className="fixed right-4 top-4 z-[300] flex max-w-sm items-center gap-3 rounded-2xl bg-gray900 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">
          {needRefresh ? "A new version of Soma is available" : "Soma is ready to work offline"}
        </p>
        {needRefresh && (
          <p className="mt-0.5 text-xs text-white/60">Refresh to get the latest update</p>
        )}
      </div>
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker()}
          className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-gray900 transition-colors hover:bg-white/90"
        >
          Refresh
        </button>
      )}
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-white/60 transition-colors hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};