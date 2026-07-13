import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { TeacherDetail } from "../types";

export const useTeacherDetail = (id: string) => {
  const [cached, setCached] = useState<TeacherDetail | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const sub = liveQuery(() => db.teacherDetails.get(id)).subscribe({
      next: (data) => {
        if (data?.detailJson) {
          try {
            setCached(JSON.parse(data.detailJson));
          } catch {
            setCached(undefined);
          }
        } else {
          setCached(undefined);
        }
      },
    });
    return () => sub.unsubscribe();
  }, [id]);

  const query = useQuery<TeacherDetail>({
    queryKey: teacherKeys.list(id),
    queryFn: async () => {
      const data: TeacherDetail = await fetchData(`/teachers/${id}`, "GET");
      await db.teacherDetails.put({
        id,
        detailJson: JSON.stringify(data),
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!id,
  });

  return {
    data: cached !== undefined ? cached : query.data,
    isLoading: query.isLoading && cached === undefined,
    error: query.error,
  };
};
