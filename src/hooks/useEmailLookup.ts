import { useEffect, useRef, useState } from "react";

import { findEmailOwner, type EmailLookupResult } from "../utils/emailLookup";

/**
 * Debounced real-time email lookup against the local Dexie cache.
 * Returns the lookup result and a checking flag so the UI can show
 * a badge below the email input as the user types.
 */
export const useEmailLookup = (
  email: string,
  userId: string,
  currentUserEmail?: string,
  excludeStudentId?: string,
) => {
  const [result, setResult] = useState<EmailLookupResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const trimmed = email.trim();

    if (!trimmed || !userId) {
      setResult(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const lookup = await findEmailOwner(trimmed, userId, currentUserEmail, excludeStudentId);
        setResult(lookup);
      } catch {
        setResult(null);
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [email, userId, currentUserEmail, excludeStudentId]);

  return { result, isChecking };
};
