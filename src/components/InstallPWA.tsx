import { useEffect, useState } from "react";
import { DocumentDownload } from "iconsax-react";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

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

const INSTALLED_KEY = "soma:pwa:installed";
const DISMISSED_KEY = "soma:pwa:dismissed";
const LAST_SHOWN_KEY = "soma:pwa:lastShown";

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const capturePrompt = (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", capturePrompt);
}

export function InstallPWA() {
  const [canInstall, setCanInstall] = useState(() => !!deferredInstallPrompt);
  const [installed, setInstalled] = useState(() => read(INSTALLED_KEY) === "1");
  const [open, setOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const onPrompt = () => setCanInstall(!!deferredInstallPrompt);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      write(INSTALLED_KEY, "1");
    }
  }, []);

  useEffect(() => {
    if (installed) return;
    if (read(DISMISSED_KEY) === "1") return;
    if (read(LAST_SHOWN_KEY) === todayKey()) return;
    write(LAST_SHOWN_KEY, todayKey());
    setOpen(true);
  }, [installed]);

  const markInstalled = () => {
    setInstalled(true);
    write(INSTALLED_KEY, "1");
    setOpen(false);
  };

  const handleInstall = async () => {
    const promptEvent = deferredInstallPrompt;

    if (!promptEvent) {
      setOpen(false);
      setShowGuide(true);
      return;
    }

    setOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") markInstalled();
    } catch {
      setShowGuide(true);
    } finally {
      deferredInstallPrompt = null;
      setCanInstall(false);
    }
  };

  const handleDismissForever = () => {
    write(DISMISSED_KEY, "1");
    setOpen(false);
  };

  if (installed) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent variant="middle" className="p-6 pb-10" showClose={false}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray900 mt-4">
            <DocumentDownload size={24} color="#FFFFFF" variant="Bold" />
          </div>
          <DialogHeader className="p-0 mt-4">
            <DialogTitle className="text-center text-xl">Install Soma</DialogTitle>
            <DialogDescription className="text-center mt-1.5">
              Get the app for a faster, better experience — it works offline and sits
              right on your home screen.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-2">
            <Button className="w-full rounded-full" onClick={handleInstall}>
              Install now
            </Button>
            <Button variant="outline" className="w-full rounded-full" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <button
              type="button"
              onClick={handleDismissForever}
              className="mx-auto block pt-1 pb-4 text-xs text-gray-400 hover:text-gray-900 transition-colors"
            >
              Don't show me this again
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {showGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray100 px-6 pb-8 pt-4 rounded-t-2xl shadow-lg">
          <Button
            onClick={() => setShowGuide(false)}
            className="absolute right-4 top-4 text-gray400 hover:text-gray900"
            aria-label="Dismiss"
            variant="ghost"
            size="icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
          <p className="text-sm font-semibold text-gray900">
            Install Soma on {isIOS() ? "your iPhone" : "your Android"}
          </p>
          <ol className="mt-3 space-y-2 text-sm text-gray600">
            <li className="flex items-start gap-2">
              <span className="shrink-0 font-semibold text-gray900">1.</span>
              {isIOS() ? (
                <>
                  Tap the{" "}
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Share</span>{" "}
                  button in Safari.
                </>
              ) : (
                <>
                  Tap the{" "}
                  <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">⋮</span>{" "}
                  menu in Chrome and select{" "}
                  <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add to Home screen</span>.
                </>
              )}
            </li>
            {isIOS() ? (
              <>
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
              </>
            ) : (
              <li className="flex items-start gap-2">
                <span className="shrink-0 font-semibold text-gray900">2.</span>
                Tap{" "}
                <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Install</span>{" "}
                or{" "}
                <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add</span>{" "}
                to confirm.
              </li>
            )}
          </ol>
          {!isIOS() && !canInstall && (
            <p className="mt-4 rounded-lg bg-gray100 px-3 py-2 text-xs text-gray600">
              Tip: Chrome only offers the one-tap{" "}
              <span className="rounded-md bg-white px-1 py-0.5 text-gray900">Install</span> after you've used
              Soma a few times. Until then, the menu steps above work just fine.
            </p>
          )}
        </div>
      )}
    </>
  );
}
