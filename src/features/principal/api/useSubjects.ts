import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { subjectKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { SubjectCache } from "../../../db/db";

export type Subject = SubjectCache;

export const useSubjects = (schoolId?: string) => {
  const { user } = useAuth();
  const isPublic = !!schoolId;
  const userSchoolId = schoolId || user?.schoolId;
  const [cached, setCached] = useState<Subject[]>([]);

  useEffect(() => {
    if (isPublic) return;
    const sub = liveQuery(async () => {
      const data = await db.subjects.toArray();
      if (userSchoolId) {
        const scoped = (data as SubjectCache[]).filter((c) => c.schoolId === userSchoolId);
        if (scoped.length > 0) return scoped;
      }
      return data as SubjectCache[];
    }).subscribe({
      next: (data) => setCached(data as Subject[]),
    });
    return () => sub.unsubscribe();
  }, [isPublic, userSchoolId]);

  const queryKey = isPublic ? [...subjectKeys.lists(), "public", schoolId] : subjectKeys.lists();

  const query = useQuery<Subject[]>({
    queryKey,
    queryFn: async () => {
      const url = isPublic ? `/subjects?schoolId=${schoolId}` : "/subjects?limit=200";
      const res = await fetchData<Subject[] | { subjects: Subject[]; total: number; page: number; totalPages: number }>(url, "GET");
      const data = Array.isArray(res) ? res : res.subjects;
      if (!isPublic) {
        await db.transaction("rw", db.subjects, async () => {
          await db.subjects.clear();
          await db.subjects.bulkAdd(data.map((s) => ({ ...s, schoolId: userSchoolId })));
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

  return {
    data: cached.length > 0 ? cached : query.data,
    isLoading: query.isLoading && cached.length === 0,
    error: cached.length > 0 ? undefined : query.error,
  };
};
