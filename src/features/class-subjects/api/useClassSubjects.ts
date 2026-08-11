import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type ClassSubjectsCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { classSubjectKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, ClassSubjectAssignment } from "../types";

export const useClassSubjects = (schoolId?: string) => {
  const { user } = useAuth();
  const isPublic = !!schoolId;
  const userSchoolId = schoolId || user?.schoolId;

  const publicQuery = useQuery<ClassSubjectAssignment[], AxiosErrorResponse>({
    queryKey: classSubjectKeys.list(schoolId),
    queryFn: async () => {
      const res = await fetchData<{ classes: ClassSubjectAssignment[] }>(
        `/subject-assignments?schoolId=${schoolId}`,
        "GET",
      );
      return res.classes ?? [];
    },
    enabled: isPublic,
  });

  const networkQuery = useQuery<{ classes: ClassSubjectAssignment[] }, AxiosErrorResponse>({
    queryKey: classSubjectKeys.list(user?.schoolId),
    queryFn: async () => {
      const res = await fetchData<{ classes: ClassSubjectAssignment[] }>("/subject-assignments", "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(user!.id)
        .filter((i) => i.table === "classSubjects" && i.status === "pending")
        .count();

      const pendingClassIds = new Set(
        (await db.syncQueue
          .where("userId")
          .equals(user!.id)
          .toArray())
          .filter((i) => i.table === "classSubjects" && i.status === "pending")
          .flatMap((i) => ((i.payload as { classIds?: string[] })?.classIds ?? [])),
      );

      await db.transaction("rw", db.classSubjects, async () => {
        if (hasPending === 0) {
          await db.classSubjects.where("userId").equals(user!.id).delete();
        }
        if (res.classes?.length) {
          const rows = res.classes
            .filter((c: ClassSubjectAssignment) => !pendingClassIds.has(c.classId))
            .map((c: ClassSubjectAssignment) => ({
              id: c.classId,
              userId: user!.id,
              classId: c.classId,
              subjectIds: c.subjectIds ?? [],
              schoolId: user?.schoolId ?? "",
              updatedAt: Date.now(),
            }));
          if (rows.length) {
            await db.classSubjects.bulkPut(rows);
          }
        }
      });

      return res;
    },
    enabled: !isPublic && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const cached = useLiveQuery(
    () => {
      if (isPublic || !user) return Promise.resolve([] as ClassSubjectsCache[]);
      return db.classSubjects.where("userId").equals(user.id).toArray();
    },
    [isPublic, user?.id],
  );

  if (isPublic) {
    return {
      data: publicQuery.data ?? [],
      isLoading: publicQuery.isLoading,
      error: publicQuery.error,
    };
  }

  const rows = cached ?? [];
  const filtered = userSchoolId ? rows.filter((r) => r.schoolId === userSchoolId) : rows;
  const valid: ClassSubjectAssignment[] =
    cached !== undefined
      ? filtered.map((r) => ({ classId: r.classId, subjectIds: r.subjectIds }))
      : (networkQuery.data?.classes ?? []).map((c) => ({ classId: c.classId, subjectIds: c.subjectIds ?? [] }));

  return {
    data: valid,
    isLoading: cached === undefined || (filtered.length === 0 && networkQuery.isLoading),
    error: networkQuery.error ?? undefined,
  };
};