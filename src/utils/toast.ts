import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
  /** Which corner the toast renders in — long-lived notices go left so they
   *  don't cover the sync indicator in the bottom-right. */
  position?: "left" | "right";
}

const DURATION = 3200;
const EXIT_MS = 250;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => toasts;

const update = (id: number, patch: Partial<ToastItem>) => {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
};

const remove = (id: number) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

const push = (
  type: ToastType,
  message: string,
  duration: number = DURATION,
  position: "left" | "right" = "right",
) => {
  const id = nextId++;
  toasts = [...toasts, { id, type, message, position }];
  emit();

  setTimeout(() => update(id, { leaving: true }), duration);
  setTimeout(() => remove(id), duration + EXIT_MS);
  return id;
};

/** Immediately removes a toast (e.g. when the user clicks it). */
export const dismissToast = (id: number) => remove(id);

export const toast = {
  success: (message: string) => push("success", message),
  info: (message: string, opts?: { duration?: number; position?: "left" | "right" }) =>
    push("info", message, opts?.duration ?? DURATION, opts?.position),
  error: (message: string, opts?: { duration?: number; position?: "left" | "right" }) =>
    push("error", message, opts?.duration ?? DURATION, opts?.position),
};

export const useToasts = () => useSyncExternalStore(subscribe, getSnapshot);
