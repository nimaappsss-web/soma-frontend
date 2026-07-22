import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";
import type { SubjectAssignment } from "../types";

export const useMyAssignments = (userId: string) => {
  const data = useLiveQuery(
    () => (userId ? db.teacherAssignments.get(userId) : Promise.resolve(undefined)),
    [userId],
  );

  const parsed: SubjectAssignment[] = data?.assignmentsJson
    ? JSON.parse(data.assignmentsJson)
    : [];

  return {
    data: parsed,
    isLoading: data === undefined,
    error: undefined,
  };
};
