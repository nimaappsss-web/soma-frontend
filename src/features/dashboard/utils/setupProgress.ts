const STORAGE_KEY_PREFIX = "soma_setup_progress";

export const getStoredProgress = (userId: string): number => {
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${userId}`);
  return raw ? Number(raw) : 0;
};

export const setStoredProgress = (userId: string, percentage: number): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}_${userId}`, String(percentage));
};
