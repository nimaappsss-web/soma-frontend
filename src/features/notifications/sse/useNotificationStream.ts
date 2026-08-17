import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { notificationKeys } from "../utils/query-keys";
import {
  connectNotificationStream,
  disconnectNotificationStream,
  subscribeToNotificationEvents,
} from "./notificationStream";

export const useNotificationStream = () => {
  const { user } = useAuth();
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
};