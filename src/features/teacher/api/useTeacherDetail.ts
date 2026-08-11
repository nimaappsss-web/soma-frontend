import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type TeacherDetailCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { teachers } from "../../../lib/queryKeys";
import type { TeacherDetail } from "../types";

export const useTeacherDetail = (id: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cache = useLiveQuery(
    async () => {
      if (!id || !userId) return undefined;
      const rec = await db.teacherDetails.get(id);
      return rec && rec.userId === userId ? rec : undefined;
    },
    [id, userId],
  ) as TeacherDetailCache | undefined;

  const query = useQuery<TeacherDetail>({
    queryKey: teachers.detail(id),
    queryFn: async () => {
      const res = await fetchData<TeacherDetail>(`/teachers/${id}`, "GET");
      await db.teacherDetails.put({ id, userId, detailJson: JSON.stringify(res) }, id);
      return res;
    },
    enabled: !!id && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Memoize the parsed cache row so `data` keeps a stable reference while
  // detailJson is unchanged — JSON.parse in render created a new object on every
  // render, which made any effect depending on `data` (e.g. EditTeacherForm's
  // reset) run and re-render forever ("Maximum update depth exceeded").
  const parsed: TeacherDetail | undefined = useMemo(
    () => (cache?.detailJson ? (JSON.parse(cache.detailJson) as TeacherDetail) : undefined),
    [cache?.detailJson],
  );

  return {
    // Dexie is the source of truth for reads (offline-first). query.data must
    // NOT take precedence — once the query has loaded it would mask local Dexie
    // writes (e.g. EditTeacherForm) until a refetch, so edits wouldn't reflect
    // immediately.
    data: parsed ?? query.data,
    isLoading: cache === undefined && query.isPending,
    error: query.error ?? undefined,
  };
};
