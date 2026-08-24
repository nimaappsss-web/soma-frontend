import type { Class } from "../../principal/api/useClasses";

const NON_NUMERIC_ORDER: Record<string, number> = {
  creche: 0,
  "pre-nursery": 1,
  nursery: 2,
  kg: 3,
  kindergarten: 3,
};

const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6",
};

/**
 * Extracts a sortable level number from strings like "JSS 1", "SS 2",
 * "Primary 6", "Nursery 2", "KG". Non-numeric early-years levels get fixed
 * ranks; unknown levels sort after known ones within their group.
 */
export const levelRank = (level: string): { group: string; rank: number; numeric: boolean } => {
  const normalized = level.trim().toLowerCase();

  const arabic = normalized.match(/(\d+)/);
  if (arabic) {
    return {
      group: normalized.replace(/(\d+)/, "").trim(),
      rank: parseInt(arabic[1], 10),
      numeric: true,
    };
  }

  const romanWord = normalized.split(/\s+/).find((w) => w in ROMAN);
  if (romanWord) {
    const rank = parseInt(ROMAN[romanWord], 10);
    return { group: normalized.replace(romanWord, "").trim(), rank, numeric: true };
  }

  for (const key of Object.keys(NON_NUMERIC_ORDER)) {
    if (normalized.includes(key)) {
      return { group: normalized.replace(key, "").trim(), rank: NON_NUMERIC_ORDER[key], numeric: false };
    }
  }

  return { group: normalized, rank: Number.MAX_SAFE_INTEGER, numeric: false };
};

export const sortClassesForPromotion = (classes: Class[]): Class[] =>
  [...classes].sort((a, b) => {
    const la = levelRank(a.level);
    const lb = levelRank(b.level);
    if (la.group !== lb.group) return la.group.localeCompare(lb.group);
    if (la.rank !== lb.rank) return la.rank - lb.rank;
    return (a.arm ?? "").localeCompare(b.arm ?? "");
  });

/**
 * Recommended destination for each class, in the Nigerian third-term style:
 * every class promotes to the next level with the same arm
 * (JSS 2B → JSS 3B). The topmost class of its school type has no next level,
 * so it graduates.
 */
export const recommendDestinations = (sorted: Class[]): Record<string, string | "GRADUATE"> => {
  const result: Record<string, string | "GRADUATE"> = {};

  sorted.forEach((cls, i) => {
    const current = levelRank(cls.level);
    let next: Class | undefined;

    // Look ahead through same-group classes for the next rank, preferring the same arm.
    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      const candLevel = levelRank(candidate.level);
      if (candLevel.group !== current.group || !candLevel.numeric) continue;
      if (candLevel.rank === current.rank + 1) {
        next = candidate;
        break;
      }
      if (candLevel.rank > current.rank) {
        next = candidate;
        break;
      }
    }

    // Prefer an exact arm match at the target rank if one exists.
    if (next && cls.arm) {
      const armMatch = sorted.find(
        (c) =>
          c.id !== cls.id &&
          levelRank(c.level).group === current.group &&
          levelRank(c.level).rank === current.rank + 1 &&
          c.arm === cls.arm,
      );
      if (armMatch) next = armMatch;
    }

    result[cls.id] = next ? next.id : "GRADUATE";
  });

  return result;
};
