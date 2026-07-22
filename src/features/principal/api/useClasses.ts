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

  const data = useLiveQuery(
    () => {
      if (isPublic) return Promise.resolve([] as Class[]);
      return db.classes.toArray() as Promise<Class[]>;
    },
    [isPublic],
  );

  if (isPublic) {
    return {
      data: publicQuery.data,
      isLoading: publicQuery.isLoading,
      error: publicQuery.error,
    };
  }

  const filtered = data
    ? userSchoolId
      ? data.filter((c) => c.schoolId === userSchoolId)
      : data
    : [];

  const valid = filtered.length > 0 ? filtered : (data ?? []);

  return {
    data: { classes: valid, levels: [...new Set(valid.map((c) => c.level))] },
    isLoading: data === undefined,
    error: undefined,
  };
};
