import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
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

const push = (type: ToastType, message: string) => {
  const id = nextId++;
  toasts = [...toasts, { id, type, message }];
  emit();

  setTimeout(() => update(id, { leaving: true }), DURATION);
  setTimeout(() => remove(id), DURATION + EXIT_MS);
  return id;
};

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

export const useToasts = () => useSyncExternalStore(subscribe, getSnapshot);
