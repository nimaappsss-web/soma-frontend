import { API_BASE_URL } from "../../../lib/axios";
import { tokenStorage } from "../../../utils/storage";

// Module-level singleton: exactly one EventSource per tab regardless of how
// many NotificationBell instances are mounted (desktop + mobile both render).
// The access token travels as a query param because EventSource cannot set
// custom headers and dev mode is cross-origin (5173 -> 3000).
let source: EventSource | null = null;
let activeUserId: string | null = null;
let activeToken: string | null = null;
let tokenCheckTimer: number | null = null;
let consumerCount = 0;

const subscribers = new Set<() => void>();

const buildUrl = (token: string) =>
  `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;

const create = (userId: string, token: string) => {
  activeUserId = userId;
  activeToken = token;
  source = new EventSource(buildUrl(token));
  source.addEventListener("notification", () => {
    subscribers.forEach((cb) => cb());
  });
};

const teardown = () => {
  if (tokenCheckTimer !== null) {
    window.clearInterval(tokenCheckTimer);
    tokenCheckTimer = null;
  }
  if (source) {
    source.close();
    source = null;
  }
  activeUserId = null;
  activeToken = null;
};

const ensureConnected = (userId: string) => {
  const token = tokenStorage.getToken();
  if (!token) {
    teardown();
    return;
  }

  if (source && activeUserId === userId && activeToken === token) return;

  teardown();
  create(userId, token);

  // The axios interceptor silently refreshes the access token (updating the
  // cookie). Recreate the stream with the fresh token so the connection stays
  // authorized without waiting for EventSource's auto-reconnect to recover.
  tokenCheckTimer = window.setInterval(() => {
    const current = tokenStorage.getToken();
    if (source && activeUserId && current && current !== activeToken) {
      const uid = activeUserId;
      teardown();
      create(uid, current);
    }
  }, 30000);
};

export const connectNotificationStream = (userId: string) => {
  consumerCount += 1;
  if (userId) ensureConnected(userId);
};

export const disconnectNotificationStream = () => {
  consumerCount = Math.max(0, consumerCount - 1);
  if (consumerCount === 0) teardown();
};

export const subscribeToNotificationEvents = (cb: () => void) => {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
};