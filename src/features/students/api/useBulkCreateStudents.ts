import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { BulkCreatePayload, BulkCreateResponse, AxiosErrorResponse } from "../types";

const genId = () => crypto.randomUUID();

export const useBulkCreateStudents = () => {
  const { user } = useAuth();

  return useMutation<BulkCreateResponse, AxiosErrorResponse, BulkCreatePayload>({
    mutationFn: async (payload) => {
      const userId = user?.id ?? "";
      const schoolId = user?.schoolId ?? "";
      const now = Date.now();

      const studentsWithIds = payload.students.map((s) => ({
        ...s,
        id: genId(),
      }));

      await db.students.bulkPut(
        studentsWithIds.map((s) => ({
          id: s.id,
          userId,
          name: s.name,
          admissionNo: s.admissionNo,
          classId: s.classId,
          gender: s.gender ?? null,
          dateOfBirth: s.dateOfBirth ?? null,
          address: s.address ?? null,
          imageUrl: s.imageUrl ?? null,
          parentName: s.parentName ?? null,
          parentPhone: s.parentPhone ?? null,
          parentEmail: s.parentEmail ?? null,
          status: "ACTIVE" as const,
          schoolId,
          createdAt: now,
        })),
      );

      await addToQueue({
        userId,
        table: "students",
        recordId: `bulk_${now}`,
        endpoint: "/students/bulk",
        method: "POST",
        payload: { students: studentsWithIds },
      });

      return { created: studentsWithIds.length, failed: [] };
    },
    onSuccess: async (data) => {
      toast.success(`${data.created} student(s) added!`);
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
