import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { classKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { ClassCache } from "../../../db/db";

export type Class = ClassCache;

export interface ClassesResponse {
  classes: Class[];
  levels: string[];
}

export const useClasses = (schoolId?: string) => {
  const { user } = useAuth();
  const isPublic = !!schoolId;
  const userSchoolId = schoolId || user?.schoolId;
  const [cached, setCached] = useState<Class[]>([]);

  useEffect(() => {
    if (isPublic) return;
    const sub = liveQuery(async () => {
      const data = await db.classes.toArray();
      return userSchoolId
        ? (data as ClassCache[]).filter((c) => c.schoolId === userSchoolId)
        : (data as ClassCache[]);
    }).subscribe({
      next: (data) => setCached(data as Class[]),
    });
    return () => sub.unsubscribe();
  }, [isPublic, userSchoolId]);

  const queryKey = isPublic ? [...classKeys.lists(), "public", schoolId] : classKeys.lists();

  const query = useQuery<ClassesResponse>({
    queryKey,
    queryFn: async () => {
      const url = isPublic ? `/classes?schoolId=${schoolId}` : "/classes";
      const res = await fetchData<ClassesResponse | Class[]>(url, "GET");
      const data: ClassesResponse = Array.isArray(res)
        ? { classes: res, levels: [...new Set(res.map((c) => c.level))] }
        : res;
      if (!isPublic) {
        await db.transaction("rw", db.classes, async () => {
          await db.classes.clear();
          await db.classes.bulkAdd(data.classes.map((c) => ({ ...c, schoolId: userSchoolId })));
        });
      }
      return data;
    },
    staleTime: isPublic ? 0 : Infinity,
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
    error: cached.length > 0 ? undefined : query.error,
  };
};
