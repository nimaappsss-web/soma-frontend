import type { ClassSubjectAssignment } from "../types";

/**
 * Returns the subject ids that the principal has assigned to EVERY one of the
 * given classes (intersection). An empty `classIds` returns an empty set,
 * meaning "no constraint yet".
 */
export const subjectIdsForClasses = (
  assignments: ClassSubjectAssignment[],
  classIds: string[],
): Set<string> => {
  if (classIds.length === 0) return new Set();
  const sets = classIds.map(
    (cid) => new Set(assignments.find((a) => a.classId === cid)?.subjectIds ?? []),
  );
  return sets.reduce<Set<string>>(
    (acc, s) => new Set([...acc].filter((x) => s.has(x))),
    sets[0] ?? new Set<string>(),
  );
};