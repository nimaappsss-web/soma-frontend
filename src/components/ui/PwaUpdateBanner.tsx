import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export const PwaUpdateBanner = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisteredSW: (_url, reg) => {
      registrationRef.current = reg ?? null;
      if (reg) {
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed") {
              setNeedRefresh(true);
            }
          });
        });
      }
      if (navigator.serviceWorker) {
        void reg?.update().catch(() => {});
      }
    },
  });

  useEffect(() => {
    const check = () => {
      void registrationRef.current?.update().catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(check, 15 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (offlineReady) setShow(true);
  }, [offlineReady]);

  if (!show) return null;

  const close = () => {
    setShow(false);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="fixed right-4 top-4 z-[300] flex max-w-sm items-center gap-3 rounded-2xl bg-gray900 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">Soma is ready to work offline</p>
      </div>
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