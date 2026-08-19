import { useEffect, useState } from "react";
import { DocumentDownload } from "iconsax-react";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { InstallGuideSteps } from "./InstallGuideSteps";
import {
  usePwaInstall,
  isIOS,
  readStorage,
  writeStorage,
  DISMISSED_KEY,
  LAST_SHOWN_KEY,
} from "../utils/pwaInstall";

const todayKey = () => new Date().toISOString().slice(0, 10);

export function InstallPWA() {
  const { installed, canInstall, install } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (installed) return;
    if (readStorage(DISMISSED_KEY) === "1") return;
    if (readStorage(LAST_SHOWN_KEY) === todayKey()) return;
    writeStorage(LAST_SHOWN_KEY, todayKey());
    setOpen(true);
  }, [installed]);

  const handleInstall = async () => {
    setOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { available, accepted } = await install();
    if (!available && !accepted) setShowGuide(true);
  };

  const handleDismissForever = () => {
    writeStorage(DISMISSED_KEY, "1");
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
          <InstallGuideSteps showTip={!canInstall} />
        </div>
      )}
    </>
  );
}