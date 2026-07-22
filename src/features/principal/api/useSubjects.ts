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

  const networkQuery = useQuery<{ subjects: SubjectCache[] }, AxiosErrorResponse>({
    queryKey: ["subjects", user?.id],
    queryFn: async () => {
      const res = await fetchData<{ subjects: SubjectCache[] }>("/subjects?limit=200", "GET");
      if (res.subjects?.length && user) {
        await db.subjects.bulkPut(
          (res.subjects as SubjectCache[]).map((s) => ({ ...s, userId: user.id, schoolId: user.schoolId ?? "" })),
        );
      }
      return res;
    },
    enabled: !isPublic && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const data = useLiveQuery(
    () => {
      if (isPublic || !user) return Promise.resolve([] as Subject[]);
      return db.subjects.where("userId").equals(user.id).toArray() as Promise<Subject[]>;
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
    ? cached.filter((s) => s.schoolId === userSchoolId)
    : cached;
  const valid = filtered.length > 0 ? filtered : (networkQuery.data?.subjects ?? []);

  return {
    data: valid,
    isLoading: data === undefined && networkQuery.isLoading,
    error: networkQuery.error ?? undefined,
  };
};
