import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { notificationKeys } from "../utils/query-keys";
import type { NotificationItem, AxiosErrorResponse } from "../types";

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ notification: NotificationItem }, AxiosErrorResponse, string>({
    mutationFn: (id) => fetchData(`/notifications/${id}/read`, "PATCH"),
    onSuccess: async (_data, id) => {
      await db.notifications.update(id, { read: true });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};