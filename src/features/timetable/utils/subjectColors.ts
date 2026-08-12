/**
 * Stable per-subject colors: derived purely from the subject id, so the same
 * subject renders with the exact same color everywhere it appears (double
 * periods, later periods, regenerations, desktop and mobile). 50 swatches keep
 * different subjects visually distinct even in large schools.
 *
 * Ordered so that neighbouring swatches belong to different hue families. This
 * matters because subjects are assigned colours by their sorted index, so the
 * closer two subjects sit in the array, the more their colours must differ.
 */
export const SUBJECT_COLORS = [
  "bg-azure500/10 text-azure500",
  "bg-red400/10 text-red500",
  "bg-teal500/10 text-teal500",
  "bg-lime500/10 text-lime500",
  "bg-orange400/10 text-orange600",
  "bg-indigo500/10 text-indigo500",
  "bg-slate500/10 text-slate600",
  "bg-orange500/10 text-orange700",
  "bg-slate600/10 text-slate600",
  "bg-sky500/10 text-sky500",
  "bg-red500/10 text-red500",
  "bg-teal600/10 text-teal600",
  "bg-yellow500/10 text-yellow500",
  "bg-fuchsia500/10 text-fuchsia500",
  "bg-yellow600/10 text-yellow600",
  "bg-fuchsia600/10 text-fuchsia600",
  "bg-orange600/10 text-orange700",
  "bg-stone500/10 text-stone600",
  "bg-blue500/10 text-blue500",
  "bg-rose500/10 text-rose500",
  "bg-emerald500/10 text-emerald500",
  "bg-rose600/10 text-rose600",
  "bg-emerald600/10 text-emerald600",
  "bg-amber400/20 text-amber500",
  "bg-purple400/10 text-purple500",
  "bg-blue600/10 text-blue600",
  "bg-violet700/10 text-violet700",
  "bg-rose700/10 text-rose700",
  "bg-green500/10 text-green500",
  "bg-amber500/10 text-amber600",
  "bg-purple500/10 text-purple500",
  "bg-green600/10 text-green600",
  "bg-purple600/10 text-purple600",
  "bg-azure600/10 text-azure600",
  "bg-crimson400/10 text-crimson500",
  "bg-violet500/10 text-violet500",
  "bg-cyan500/10 text-cyan500",
  "bg-crimson500/10 text-red500",
  "bg-green700/10 text-green700",
  "bg-cyan600/10 text-cyan600",
  "bg-pink500/10 text-pink500",
  "bg-springgreen600/10 text-springgreen600",
  "bg-violet600/10 text-violet600",
  "bg-blue700/10 text-blue700",
  "bg-pink600/10 text-pink600",
  "bg-mint800/10 text-mint800",
  "bg-indigo600/10 text-indigo600",
  "bg-green400/10 text-green700",
  "bg-pink700/10 text-pink700",
  "bg-indigo700/10 text-indigo700",
];

/**
 * Assigns each subject a guaranteed-unique swatch by sorted subject id, so the
 * mapping is deterministic (stable across regenerations) and no two subjects in
 * the same timetable ever share a colour.
 */
export const buildSubjectColorMap = (entries: Array<{ subjectId?: string }>): Map<string, string> => {
  const ids = Array.from(new Set(entries.map((e) => e.subjectId).filter((x): x is string => !!x))).sort();
  const map = new Map<string, string>();
  ids.forEach((id, i) => map.set(id, SUBJECT_COLORS[i % SUBJECT_COLORS.length]));
  return map;
};

/** Solid `bg-*` token (no tint) for a swatch — used for small markers. */
export const solidSwatch = (cls: string): string =>
  cls.split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500";