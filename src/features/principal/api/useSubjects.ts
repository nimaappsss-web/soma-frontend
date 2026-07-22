import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { SubjectCache } from "../../../db/db";
import type { AxiosErrorResponse } from "../types";

export type Subject = SubjectCache;

export const useSubjects = (schoolId?: string) => {
  const { user } = useAuth();
  const isPublic = !!schoolId;
  const userSchoolId = schoolId || user?.schoolId;

  const publicQuery = useQuery<Subject[], AxiosErrorResponse>({
    queryKey: ["subjects", "public", schoolId],
    queryFn: () => fetchData(`/subjects?schoolId=${schoolId}`, "GET"),
    enabled: isPublic,
  });

  const data = useLiveQuery(
    () => {
      if (isPublic) return Promise.resolve([] as Subject[]);
      return db.subjects.toArray() as Promise<Subject[]>;
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
      ? data.filter((s) => s.schoolId === userSchoolId)
      : data
    : [];

  return {
    data: filtered.length > 0 ? filtered : data ?? [],
    isLoading: data === undefined,
    error: undefined,
  };
};
