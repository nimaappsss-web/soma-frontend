import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import { db } from "../../../db/db";

export const useMyFormClass = (userId: string) => {
  const [cached, setCached] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(() => db.teacherFormClass.get(userId)).subscribe({
      next: (data) => setCached(data?.formClass ?? null),
    });
    return () => sub.unsubscribe();
  }, [userId]);

  const query = useQuery<string | null>({
    queryKey: teacherKeys.formClassDetail(userId),
    queryFn: async () => {
      const res: { formClassId?: string | null; formClass?: { id: string; name: string; level: string; arm?: string } | null } = await fetchData("/teachers/form-class", "GET");
      const formClass = res?.formClass?.name ?? null;
      await db.teacherFormClass.put({ id: userId, formClass });
      return formClass;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!userId,
  });

  return {
    data: cached !== undefined ? cached : query.data ?? null,
    isLoading: query.isLoading && cached === undefined,
    error: query.error,
  };
};
