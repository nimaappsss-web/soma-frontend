import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";

const TIMEOUT = 3000;

export const useResendInvite = () => {
  const { user } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (inviteId) => {
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
    onSuccess: async () => {
      toast.success("Invitation resent!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
