import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleIOS = () => setShowIOSGuide(true);

  if (installed || isStandalone()) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray100 px-6 pb-8 pt-4 rounded-t-2xl shadow-lg">
        <button
          onClick={() => setShowIOSGuide(false)}
          className="absolute right-4 top-4 text-gray400 hover:text-gray900"
          aria-label="Dismiss"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-gray900">Install Soma on your iPhone</p>
        <ol className="mt-3 space-y-2 text-sm text-gray600">
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-semibold text-gray900">1.</span>
            Tap the <span className="inline-flex items-center gap-1 rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Share</span>{" "}
            button in Safari.
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-semibold text-gray900">2.</span>
            Scroll down and tap{" "}
            <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">
              Add to Home Screen
            </span>
            .
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-semibold text-gray900">3.</span>
            Tap <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add</span> in the
            top-right corner.
          </li>
        </ol>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray900 text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm"
      >
        Install Soma
      </button>
    );
  }

  if (isIOS()) {
    return (
      <button
        onClick={handleIOS}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray900 text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm"
      >
        Install Soma
      </button>
    );
  }

  return null;
}
