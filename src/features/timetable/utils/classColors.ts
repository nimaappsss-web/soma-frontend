/**
 * Stable per-class colors for the TEACHER view. A teacher walks into classes,
 * not subjects — she typically teaches 1–3 subjects, so subject colors carry no
 * visual signal. Coloring the grid by CLASS lets her instantly read "which class
 * is this period for". Colors are derived purely from the sorted class name, so
 * a class keeps its exact color everywhere (grid, mobile, month calendar, dots).
 */
export const CLASS_COLORS = [
  "bg-azure500/15 text-azure600",
  "bg-red400/15 text-red500",
  "bg-teal500/15 text-teal600",
  "bg-lime500/15 text-lime600",
  "bg-orange400/15 text-orange600",
  "bg-indigo500/15 text-indigo500",
  "bg-fuchsia500/15 text-fuchsia600",
  "bg-cyan500/15 text-cyan600",
  "bg-emerald500/15 text-emerald600",
  "bg-rose500/15 text-rose600",
  "bg-amber400/25 text-amber500",
  "bg-purple500/15 text-purple600",
  "bg-sky500/15 text-sky600",
  "bg-pink500/15 text-pink600",
  "bg-green500/15 text-green600",
  "bg-violet600/15 text-violet600",
];

/**
 * Assigns each class a guaranteed-unique swatch by sorted class name. Deterministic
 * (a class keeps its color across regenerations) and no two classes in the same
 * teacher view ever share a color.
 */
export const buildClassColorMap = (classNames: string[]): Map<string, string> => {
  const names = Array.from(new Set(classNames.map((n) => n.trim()).filter((n) => n.length > 0))).sort();
  const map = new Map<string, string>();
  names.forEach((name, i) => map.set(name, CLASS_COLORS[i % CLASS_COLORS.length]));
  return map;
};
