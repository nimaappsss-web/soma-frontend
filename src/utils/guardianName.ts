const LEADING_TITLE = /^(mr|mrs|ms|miss|dr|prof|alhaji|alhaja|chief)\.?\s+/i;

/**
 * Builds a guardian display name from an optional title dropdown and a free
 * text name field. If the typed name already starts with a title (e.g. the
 * user typed "Mr Jonah Josiah" and also picked "Mr" from the title dropdown),
 * the duplicate is dropped so we never end up with "Mr Mr Jonah Josiah".
 */
export const buildGuardianName = (title: string, rawName: string): string => {
  const trimmed = rawName.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const cleanTitle = title.trim();
  if (!cleanTitle) return trimmed;

  const stripped = trimmed.replace(LEADING_TITLE, "").trim();
  if (!stripped) return cleanTitle;

  return `${cleanTitle} ${stripped}`.trim();
};