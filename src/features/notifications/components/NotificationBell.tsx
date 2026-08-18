import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { NotificationBing, DirectboxNotif } from "iconsax-react";

import { useNotifications } from "../api/useNotifications";
import { useMarkNotificationRead } from "../api/useMarkNotificationRead";
import { useMarkAllRead } from "../api/useMarkAllRead";
import { useNotificationStream } from "../sse/useNotificationStream";
import type { NotificationItem } from "../types";

const timeLabel = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const NotificationBell = () => {
  const { data, unreadCount } = useNotifications({ limit: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  useNotificationStream();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const notifications = data?.notifications ?? [];

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.route) navigate(n.route);
  };

  const badge = unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${badge ? ` (${badge} unread)` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-[38px] h-[38px] rounded-full border border-gray100 text-gray700 hover:text-gray900 hover:border-gray200 transition-colors"
      >
        <NotificationBing variant="Linear" size={22} color="#0D0D0D" />
        {badge && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-springgreen600 text-white text-[10px] font-semibold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[70px] z-[60] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-xl border border-gray100 bg-white shadow-lg md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[360px] md:max-w-[360px] md:translate-x-0">
          <div className="flex items-center justify-between border-b border-gray100 px-4 py-3">
            <p className="text-sm font-semibold text-gray900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-azure600 hover:text-azure700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                <DirectboxNotif size={28} color="#BBBBBB" variant="Outline" />
                <p className="text-sm text-gray500">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray50"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-azure500"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          n.read ? "font-medium text-gray700" : "font-semibold text-gray900"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-gray400">
                        {timeLabel(n.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-gray500">
                      {n.message}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};