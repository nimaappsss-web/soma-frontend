import type { AcademicTerm } from "../types";

const TERM_ORDER = ["first", "second", "third"] as const;

const TERM_LABELS: Record<string, { label: string; short: string }> = {
  first: { label: "First Term", short: "I" },
  second: { label: "Second Term", short: "II" },
  third: { label: "Third Term", short: "III" },
  "1": { label: "First Term", short: "I" },
  "2": { label: "Second Term", short: "II" },
  "3": { label: "Third Term", short: "III" },
};

export const termLabel = (term: string) => {
  return TERM_LABELS[term] ?? { label: term, short: "" };
};

export const termNumber = (term: string): number => {
  const n = parseInt(term, 10);
  if (!isNaN(n)) return n;
  const idx = TERM_ORDER.indexOf(term as (typeof TERM_ORDER)[number]);
  return idx >= 0 ? idx + 1 : 1;
};

const parseLocalDate = (dateStr: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

export const isDateInRange = (start: string, end: string, today: Date = new Date()): boolean => {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return false;
  return today >= s && today <= e;
};

export const resolveActiveTerm = (terms: AcademicTerm[], today: Date = new Date()): AcademicTerm | undefined => {
  const flagged = terms.find((t) => t.isCurrent);
  if (flagged) return flagged;
  return terms.find((t) => isDateInRange(t.startDate, t.endDate, today));
};
