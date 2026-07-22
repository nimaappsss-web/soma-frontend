import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { ClassCache } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

export type Class = ClassCache;

export interface ClassesResponse {
  classes: Class[];
  levels: string[];
}

export const useClasses = (schoolId?: string) => {
  const { user } = useAuth();
  const isPublic = !!schoolId;
  const userSchoolId = schoolId || user?.schoolId;

  const publicQuery = useQuery<ClassesResponse, AxiosErrorResponse>({
    queryKey: ["classes", "public", schoolId],
    queryFn: () => fetchData(`/classes?schoolId=${schoolId}`, "GET"),
    enabled: isPublic,
  });

  const networkQuery = useQuery<{ classes: ClassCache[] }, AxiosErrorResponse>({
    queryKey: ["classes", user?.id],
    queryFn: async () => {
      const res = await fetchData<{ classes: ClassCache[] }>("/classes", "GET");
      if (res.classes?.length && user) {
        await db.classes.bulkPut(
          (res.classes as ClassCache[]).map((c) => ({ ...c, userId: user.id, schoolId: user.schoolId ?? "" })),
        );
      }
      return res;
    },
    enabled: !isPublic && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const data = useLiveQuery(
    () => {
      if (isPublic || !user) return Promise.resolve([] as Class[]);
      return db.classes.where("userId").equals(user.id).toArray() as Promise<Class[]>;
    },
    [isPublic, user?.id],
  );

  if (isPublic) {
    return {
      data: publicQuery.data,
      isLoading: publicQuery.isLoading,
      error: publicQuery.error,
    };
  }

  const cached = data ?? [];
  const filtered = userSchoolId
    ? cached.filter((c) => c.schoolId === userSchoolId)
    : cached;
  const valid = filtered.length > 0 ? filtered : (networkQuery.data?.classes ?? []);

  return {
    data: { classes: valid, levels: [...new Set(valid.map((c) => c.level))] },
    isLoading: data === undefined && networkQuery.isLoading,
    error: networkQuery.error ?? undefined,
  };
};
