import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db, type TeacherAssignmentCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { SubjectAssignment } from "../types";

export const useMyAssignments = (userId: string) => {
  const liveData = useLiveQuery(
    () => (userId ? db.teacherAssignments.get(userId) : Promise.resolve(undefined)),
    [userId],
  ) as TeacherAssignmentCache | undefined;

  const query = useQuery({
    queryKey: ["teacherAssignments", userId],
    queryFn: async () => {
      const res = await fetchData<{ assignments: unknown[] }>("/teachers/assignments", "GET");
      await db.teacherAssignments.put({ id: userId, userId, assignmentsJson: JSON.stringify(res.assignments) }, userId);
      return res;
    },
    enabled: !!userId,
    staleTime: 0,
  });

  const apiHasData = query.data !== undefined;

  let parsed: SubjectAssignment[];
  if (query.data?.assignments) {
    parsed = query.data.assignments as SubjectAssignment[];
  } else if (liveData?.assignmentsJson) {
    parsed = JSON.parse(liveData.assignmentsJson);
  } else {
    parsed = [];
  }

  const isLoading = !apiHasData && (liveData === undefined || query.isLoading) && !query.isError;

  return {
    data: parsed,
    isLoading,
    error: query.error ?? undefined,
  };
};
