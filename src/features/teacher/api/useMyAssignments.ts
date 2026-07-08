import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { SubjectAssignment } from "../types";

export const useMyAssignments = (userId: string) => {
  const [cached, setCached] = useState<SubjectAssignment[] | undefined>(
    undefined,
  );

  useEffect(() => {
    const sub = liveQuery(() => db.teacherAssignments.get(userId)).subscribe({
      next: (data) => {
        if (data?.assignmentsJson) {
          try {
            setCached(JSON.parse(data.assignmentsJson));
          } catch {
            setCached([]);
          }
        } else {
          setCached([]);
        }
      },
    });
    return () => sub.unsubscribe();
  }, [userId]);

  const query = useQuery<SubjectAssignment[]>({
    queryKey: teacherKeys.assignments(userId),
    queryFn: async () => {
      const res: { assignments: SubjectAssignment[] } = await fetchData("/teachers/assignments", "GET");
      const assignments: SubjectAssignment[] = res?.assignments ?? [];
      await db.teacherAssignments.put({
        id: userId,
        assignmentsJson: JSON.stringify(assignments),
      });
      return assignments;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!userId,
  });

  return {
    data: cached !== undefined ? cached : query.data ?? [],
    isLoading: query.isLoading && cached === undefined,
    error: query.error,
  };
};
