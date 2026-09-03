import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";

/**
 * Resends (or corrects + resends) a teacher invite. This always talks directly
 * to the server — an invite token only exists server-side, so queueing offline
 * resends would silently fail. On success the teachers list is invalidated so
 * the delivery-status flag reflects what just happened.
 */
export const useResendInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { inviteId: string; email?: string }>({
    mutationFn: async ({ inviteId, email }) => {
      await fetchData(
        `/teachers/${inviteId}/resend-invite`,
        "POST",
        email ? { email } : {},
      );
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.email ? `Invitation resent to ${variables.email}` : "Invitation resent!",
      );
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
