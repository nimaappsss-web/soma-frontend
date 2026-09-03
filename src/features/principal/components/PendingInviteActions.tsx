import { Send, Edit2, Refresh2, Warning2 } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import type { PendingInvite } from "../../teacher/types";

interface PendingInviteActionsProps {
  invite: PendingInvite;
  isResending: boolean;
  onResend: () => void;
  onFixEmail: () => void;
}

/**
 * Action group + delivery-status indicator for a pending teacher invite.
 * Shows a red "email not delivered" pill when the last send failed, and a
 * proper button pair (Resend / Fix email) instead of plain text links.
 */
export const PendingInviteActions = ({
  invite,
  isResending,
  onResend,
  onFixEmail,
}: PendingInviteActionsProps) => {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {invite.emailFailed && (
        <span
          title={invite.emailError ?? "Email could not be delivered"}
          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200"
        >
          <Warning2 size={12} variant="Bold" color="#CD432F" />
          Email not delivered
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onFixEmail}
        className="h-8 rounded-full px-3 text-xs"
      >
        <Edit2 size={14} color="#0D0D0D" />
        Fix email
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onResend}
        disabled={isResending}
        className="h-8 rounded-full px-3.5 text-xs"
      >
        {isResending ? (
          <Refresh2 size={14} color="#FFFFFF" className="animate-spin" />
        ) : (
          <Send size={14} color="#FFFFFF" />
        )}
        {isResending ? "Sending…" : "Resend"}
      </Button>
    </div>
  );
};
