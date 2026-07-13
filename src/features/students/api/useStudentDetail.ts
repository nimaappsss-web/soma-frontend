import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { studentKeys } from "../utils/query-keys";
import { db } from "../../../db/db";
import type { Student } from "../types";

interface StudentDetailResponse {
  student: Student;
}

export const useStudentDetail = (id: string) => {
  const [cached, setCached] = useState<Student | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const sub = liveQuery(() => db.students.get(id)).subscribe({
      next: (data) => setCached(data as Student | undefined),
    });
    return () => sub.unsubscribe();
  }, [id]);

  const query = useQuery<Student>({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const res: StudentDetailResponse = await fetchData(`/students/${id}`, "GET");
      await db.students.put({ ...res.student, createdAt: Date.now() } as any, res.student.id);
      return res.student;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    retry: false,
  });

  return {
    data: cached !== undefined ? cached : query.data,
    isLoading: query.isLoading && cached === undefined,
    error: query.error,
  };
};
