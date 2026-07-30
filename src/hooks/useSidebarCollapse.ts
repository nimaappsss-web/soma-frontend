import { useState, useCallback } from "react";

const STORAGE_KEY = "soma-sidebar-collapsed";

const getInitial = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const useSidebarCollapse = () => {
  const [collapsed, setCollapsed] = useState(getInitial);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return { collapsed, toggle };
};
