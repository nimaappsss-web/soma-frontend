import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { fetchData } from "../../../utils/fetchData";

const TIMEOUT = 3000;

export const useResendInvite = () => {
  const { user } = useAuth();

  return useMutation<void, Error, { inviteId: string; email?: string }>({
    mutationFn: async ({ inviteId, email }) => {
      if (email) {
        // Correcting the invite email is a global-uniqueness decision only the
        // server can make — send it directly so a rejection (409) surfaces
        // immediately instead of dying silently in the sync queue.
        await fetchData(`/teachers/${inviteId}/resend-invite`, "POST", { email });
        return;
      }

      await Promise.race([
        (async () => {
          await addToQueue({
            userId: user!.id,
            table: "pendingInvites",
            recordId: inviteId,
            endpoint: `/teachers/${inviteId}/resend-invite`,
            method: "POST",
            payload: {},
          });
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.email ? `Invitation resent to ${variables.email}` : "Invitation resent!",
      );
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
