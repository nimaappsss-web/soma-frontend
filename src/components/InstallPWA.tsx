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

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => read(INSTALLED_KEY) === "1");
  const [open, setOpen] = useState(false);
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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") markInstalled();
      setDeferredPrompt(null);
      setOpen(false);
      return;
    }
    if (isIOS()) {
      setOpen(false);
      setShowIOSGuide(true);
      return;
    }
    setOpen(false);
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

      {showIOSGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray100 px-6 pb-8 pt-4 rounded-t-2xl shadow-lg">
          <Button
            onClick={() => setShowIOSGuide(false)}
            className="absolute right-4 top-4 text-gray400 hover:text-gray900"
            aria-label="Dismiss"
            variant="ghost"
            size="icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
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
      )}
    </>
  );
}