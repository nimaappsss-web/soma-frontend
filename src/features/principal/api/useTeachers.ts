import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { TeacherCache, PendingInviteCache } from "../../../db/db";
import type { TeachersResponse } from "../types";

export const useTeachers = () => {
  const [cached, setCached] = useState<TeachersResponse | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [teachers, pendingInvites] = await Promise.all([
        db.teachers.toArray(),
        db.pendingInvites.toArray(),
      ]);
      return { teachers, pendingInvites } as TeachersResponse;
    }).subscribe({
      next: (data) => setCached(data),
    });
    return () => sub.unsubscribe();
  }, []);

  const query = useQuery<TeachersResponse>({
    queryKey: principalKeys.lists(),
    queryFn: async () => {
      const data: TeachersResponse = await fetchData("/teachers", "GET");
      await db.teachers.clear();
      await db.teachers.bulkAdd(data.teachers as TeacherCache[]);
      await db.pendingInvites.clear();
      await db.pendingInvites.bulkAdd(data.pendingInvites as PendingInviteCache[]);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    data: cached ?? query.data,
    isLoading: query.isLoading && !cached,
    error: query.error,
  };
};
