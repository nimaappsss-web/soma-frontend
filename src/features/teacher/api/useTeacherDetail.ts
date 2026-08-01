import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

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
  });

  const parsed: TeacherDetail | undefined = cache?.detailJson ? JSON.parse(cache.detailJson) : undefined;

  return {
    data: query.data ?? parsed,
    isLoading: cache === undefined && query.isPending,
    error: query.error ?? undefined,
  };
};
