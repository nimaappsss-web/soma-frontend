import { useEffect, useState } from "react";
import { Monitor, Mobile, DeviceMessage } from "iconsax-react";

import { useAuth } from "../contexts/AuthContext";
import { getDeviceId } from "../utils/device";

const DISMISSED_KEY = "soma:device-banner:dismissed";

interface SessionInfo {
  deviceId: string;
  deviceType: string;
  deviceName: string | null;
  lastActivityAt: string;
  createdAt: string;
}

const deviceIcon = (type: string) => {
  switch (type) {
    case "phone":
      return <Mobile size={16} variant="Bold" color="#0D0D0D" />;
    case "tablet":
      return <DeviceMessage size={16} variant="Bold" color="#0D0D0D" />;
    default:
      return <Monitor size={16} variant="Bold" color="#0D0D0D" />;
  }
};

export const DeviceActivityBanner = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.sessions?.length) {
      setVisible(false);
      return;
    }

    const currentId = getDeviceId();
    const others = (user.sessions as SessionInfo[]).filter(
      (s) => s.deviceId !== currentId,
    );
    if (others.length === 0) {
      setVisible(false);
      return;
    }

    const recent = others.filter(
      (s) => Date.now() - new Date(s.lastActivityAt).getTime() < 24 * 60 * 60 * 1000,
    );
    if (recent.length === 0) {
      setVisible(false);
      return;
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === user.id;
    } catch {
      // ignore storage errors
    }
    if (dismissed) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [user]);

  if (!visible) return null;

  const currentId = getDeviceId();
  const others = (user?.sessions ?? []).filter(
    (s: SessionInfo) => s.deviceId !== currentId,
  );
  const mostRecent = others.reduce<SessionInfo | null>((acc, s) => {
    if (!acc) return s;
    return new Date(s.lastActivityAt) > new Date(acc.lastActivityAt) ? s : acc;
  }, null);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, user?.id ?? "");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  const deviceLabel = mostRecent?.deviceName ?? mostRecent?.deviceType ?? "another device";

  return (
    <div className="fixed left-1/2 top-3 z-[250] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:right-4 sm:left-auto sm:top-4 sm:w-auto sm:max-w-sm sm:translate-x-0">
      <div className="flex items-center gap-2.5 rounded-xl border border-gray100 bg-white px-3 py-2 text-sm text-gray900 shadow-sm">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray100">
          {deviceIcon(mostRecent?.deviceType ?? "web")}
        </span>
        <p className="min-w-0 flex-1 text-xs">
          You&apos;re also signed in on{" "}
          <span className="font-semibold capitalize">{deviceLabel}</span>.
          Changes made there show up here automatically.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 text-gray400 transition-colors hover:text-gray900"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};