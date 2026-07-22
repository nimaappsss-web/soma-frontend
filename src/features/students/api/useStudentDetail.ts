import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Student } from "../types";

export const useStudentDetail = (id: string) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const data = useLiveQuery(
    () => {
      if (!id || !userId) return Promise.resolve(undefined);
      return db.students.where({ id, userId }).first() as Promise<Student | undefined>;
    },
    [id, userId],
  );

  useQuery({
    queryKey: ["studentDetail", id, userId],
    queryFn: async () => {
      const res = await fetchData<Student>(`/students/${id}`, "GET");
      await db.students.put({ ...res, userId }, id);
      return res;
    },
    enabled: !!id && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data,
    isLoading: data === undefined,
    error: undefined,
  };
};
