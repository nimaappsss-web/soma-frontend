import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const INSTALLED_KEY = "soma:pwa:installed";
export const DISMISSED_KEY = "soma:pwa:dismissed";
export const LAST_SHOWN_KEY = "soma:pwa:lastShown";

export const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

export const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const capturePrompt = (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", capturePrompt);
}

export const getDeferredInstallPrompt = () => deferredInstallPrompt;

export const consumeDeferredInstallPrompt = () => {
  const p = deferredInstallPrompt;
  deferredInstallPrompt = null;
  return p;
};

export const isPwaInstalled = () => isStandalone() || readStorage(INSTALLED_KEY) === "1";

export const markPwaInstalled = () => writeStorage(INSTALLED_KEY, "1");

export const usePwaInstall = () => {
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [canInstall, setCanInstall] = useState(() => !!getDeferredInstallPrompt());

  useEffect(() => {
    const onPrompt = () => setCanInstall(!!getDeferredInstallPrompt());
    const onInstalled = () => {
      setInstalled(true);
      markPwaInstalled();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<{ available: boolean; accepted: boolean }> => {
    const promptEvent = consumeDeferredInstallPrompt();
    if (!promptEvent) return { available: false, accepted: false };
    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
        markPwaInstalled();
        return { available: true, accepted: true };
      }
    } catch {
      // prompt failed — treat as not available
    } finally {
      setCanInstall(false);
    }
    return { available: true, accepted: false };
  };

  return { installed, canInstall, install };
};