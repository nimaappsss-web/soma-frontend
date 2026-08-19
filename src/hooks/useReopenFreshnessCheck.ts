import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../contexts/AuthContext";
import { fetchData } from "../utils/fetchData";

const DATA_VERSION_KEY = "soma:data-version";

export const getStoredDataVersion = (): string | null => {
  try {
    return localStorage.getItem(DATA_VERSION_KEY);
  } catch {
    return null;
  }
};

export const storeDataVersion = (changedAt: string | null) => {
  try {
    if (changedAt) localStorage.setItem(DATA_VERSION_KEY, changedAt);
    else localStorage.removeItem(DATA_VERSION_KEY);
  } catch {
    // ignore storage errors
  }
};

// On app start and when the window regains focus, do a single cheap request to
// /auth/data-version. If the server reports a change newer than the last one we
// saw (either via this check or an SSE data-changed event), invalidate all
// active queries so the PWA pulls the freshest snapshot.
export const useReopenFreshnessCheck = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const res = await fetchData<{ changedAt: string | null }>(
          "/auth/data-version",
          "GET",
        );
        const server = res?.changedAt ?? null;
        const stored = getStoredDataVersion();
        if (server && (!stored || server > stored)) {
          storeDataVersion(server);
          queryClient.invalidateQueries();
        }
      } catch {
        // offline or transient — skip; the SSE stream / next focus will retry
      } finally {
        checkingRef.current = false;
      }
    };

    check();

    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [user, queryClient]);
};