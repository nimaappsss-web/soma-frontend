import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { authApi } from "../../../services/auth";
import { notificationKeys } from "../utils/query-keys";
import {
  connectNotificationStream,
  disconnectNotificationStream,
  subscribeToNotificationEvents,
  subscribeToDataChangedEvents,
} from "./notificationStream";
import {
  getStoredDataVersion,
  storeDataVersion,
} from "../../../hooks/useReopenFreshnessCheck";

export const useNotificationStream = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    connectNotificationStream(userId);
    return () => disconnectNotificationStream();
  }, [userId]);

  useEffect(() => {
    return subscribeToNotificationEvents(() => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    });
  }, [queryClient]);

  useEffect(() => {
    return subscribeToDataChangedEvents((payload) => {
      const changedAt =
        (payload as { changedAt?: string } | null)?.changedAt ?? null;
      if (changedAt) storeDataVersion(changedAt);
      queryClient.invalidateQueries();
      // Refresh the sessions list (and other /me fields) so the
      // "active on another device" banner stays current.
      authApi
        .me()
        .then((fresh) => {
          if (fresh?.sessions) updateUser({ sessions: fresh.sessions });
        })
        .catch(() => {
          // ignore transient failures
        });
    });
  }, [queryClient, updateUser]);
};