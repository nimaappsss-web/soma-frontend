import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { notificationKeys } from "../utils/query-keys";
import type { AxiosErrorResponse } from "../types";

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useMutation<{ count: number }, AxiosErrorResponse, void>({
    mutationFn: () => fetchData("/notifications/read-all", "POST"),
    onSuccess: async () => {
      if (userId) {
        await db.notifications.where("userId").equals(userId).modify({ read: true });
      }
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};