/** All school-type keys this app recognizes (kebab-case, no underscores — raw keys are never rendered in UI). */
export const SCHOOL_TYPES = ["creche", "kg", "primary", "junior-secondary", "senior-secondary"] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  creche: "Creche",
  kg: "Kindergarten",
  primary: "Primary",
  "junior-secondary": "Junior Secondary",
  "senior-secondary": "Senior Secondary",
  secondary: "Secondary",
};

/**
 * Always use this to render a school type. Falls back to a capitalized
 * dash-split of the key so unknown custom types never leak a raw key string.
 */
export const schoolTypeLabel = (t?: string | null): string => {
  if (!t) return "";
  const known = SCHOOL_TYPE_LABELS[t];
  if (known) return known;
  return t
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/**
 * Maps a class's stored school type to the config key that governs it.
 * `secondary` predates the junior/senior split and is treated as junior.
 */
export const effectiveSchoolType = (t?: string | null): string | undefined => {
  if (!t) return undefined;
  if (t === "secondary") return "junior-secondary";
  return t;
};