import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { SubjectAssignment } from "../types";

export const useMyAssignments = (userId: string) => {
  const data = useLiveQuery(
    () => (userId ? db.teacherAssignments.get(userId) : Promise.resolve(undefined)),
    [userId],
  );

  useQuery({
    queryKey: ["teacherAssignments", userId],
    queryFn: async () => {
      const res = await fetchData<{ assignments: unknown[] }>("/teachers/assignments", "GET");
      await db.teacherAssignments.put({ id: userId, userId, assignmentsJson: JSON.stringify(res.assignments) }, userId);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const parsed: SubjectAssignment[] = data?.assignmentsJson
    ? JSON.parse(data.assignmentsJson)
    : [];

  return {
    data: parsed,
    isLoading: data === undefined,
    error: undefined,
  };
};
