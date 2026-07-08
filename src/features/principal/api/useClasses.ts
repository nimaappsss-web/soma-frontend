import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { principalKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { ClassCache } from "../../../db/db";

export type Class = ClassCache;

export interface ClassesResponse {
  classes: Class[];
  levels: string[];
}

export const useClasses = (schoolId?: string) => {
  const isPublic = !!schoolId;
  const [cached, setCached] = useState<Class[]>([]);

  useEffect(() => {
    if (isPublic) return;
    const sub = liveQuery(() => db.classes.toArray()).subscribe({
      next: (data) => setCached(data as Class[]),
    });
    return () => sub.unsubscribe();
  }, [isPublic]);

  const queryKey = isPublic ? ["classes-public", schoolId] : principalKeys.classes();

  const query = useQuery<ClassesResponse>({
    queryKey,
    queryFn: async () => {
      const url = isPublic ? `/classes?schoolId=${schoolId}` : "/classes";
      const res = await fetchData<ClassesResponse | Class[]>(url, "GET");
      const data: ClassesResponse = Array.isArray(res)
        ? { classes: res, levels: [...new Set(res.map((c) => c.level))] }
        : res;
      if (!isPublic) {
        await db.classes.clear();
        await db.classes.bulkAdd(data.classes);
      }
      return data;
    },
    staleTime: isPublic ? 0 : 5 * 60 * 1000,
    enabled: true,
    retry: false,
  });

  if (isPublic) {
    return {
      data: query.data,
      isLoading: query.isLoading,
      error: query.error,
    };
  }

  const levels = cached.length > 0
    ? [...new Set(cached.map((c) => c.level))]
    : [];

  return {
    data: { classes: cached, levels },
    isLoading: query.isLoading && cached.length === 0,
    error: query.error,
  };
};
