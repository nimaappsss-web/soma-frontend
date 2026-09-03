import { InfoCircle, People, Briefcase } from "iconsax-react";

import type { EmailLookupResult } from "../../utils/emailLookup";

interface EmailLookupBadgeProps {
  result: EmailLookupResult;
}

/**
 * Contextual badge shown below an email input based on a real-time Dexie
 * lookup. Staff matches are taken accounts that block submission; parent and
 * sibling matches are informational and allow saving (children auto-link to
 * the existing parent).
 */
export const EmailLookupBadge = ({ result }: EmailLookupBadgeProps) => {
  if (!result.found) return null;

  if (result.type === "staff") {
    return (
      <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-red-300/50 bg-red-50 px-3 py-2">
        <Briefcase size={14} variant="Bold" className="mt-0.5 shrink-0" color="#CD432F" />
        <p className="text-xs text-red-700">
          This email belongs to a staff or principal account and can't be used as a parent
          contact. Use a different email.
        </p>
      </div>
    );
  }

  if (result.type === "parent") {
    return (
      <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-springgreen600/30 bg-[#E9F7EE] px-3 py-2">
        <People size={14} variant="Bold" className="mt-0.5 shrink-0" color="#34A853" />
        <p className="text-xs text-gray900">
          <span className="font-medium">{result.parentName}</span> is already registered as a
          parent. This child will be auto-linked to their account.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-300/40 bg-amber-50 px-3 py-2">
      <InfoCircle size={14} variant="Bold" className="mt-0.5 shrink-0" color="#D97706" />
      <p className="text-xs text-amber-700">
        <span className="font-medium">{result.studentName}</span>
        {result.studentClass !== "—" ? ` (${result.studentClass})` : ""} is registered with this
        email — is this a sibling?
      </p>
    </div>
  );
};
