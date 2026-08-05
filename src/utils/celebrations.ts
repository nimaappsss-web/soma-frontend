export type CelebrationType = "birthday" | "anniversary";

export interface Celebration {
  type: CelebrationType;
  years: number;
}

const parseDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Returns a celebration when `date` falls on today (same month + day).
 * - `birthday`: celebrates every year (age = years).
 * - `anniversary`: only celebrates from year 1 onward (years employed).
 */
export const getCelebration = (
  date?: string | null,
  type: CelebrationType = "birthday",
  today: Date = new Date(),
): Celebration | null => {
  const parsed = parseDate(date);
  if (!parsed) return null;
  if (parsed.getMonth() !== today.getMonth() || parsed.getDate() !== today.getDate()) {
    return null;
  }

  let years = today.getFullYear() - parsed.getFullYear();
  const thisYear = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (today < thisYear) years -= 1;

  if (type === "anniversary" && years < 1) return null;

  return { type, years: Math.max(0, years) };
};