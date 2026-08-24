import { toast } from "./toast";

/**
 * Queued writes still succeed while offline — but actions like broadcasting
 * only matter once they reach the server. When the device is offline, warn
 * the user right away instead of letting them assume it already went out.
 */
export const notifyIfOffline = (message: string) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    toast.info(message, { duration: 8000 });
  }
};
