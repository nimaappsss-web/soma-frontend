import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import type { CreateStudentPayload, Student, AxiosErrorResponse } from "../types";

const genId = () => crypto.randomUUID();

export const useCreateStudent = () => {
  const { user } = useAuth();

  return useMutation<Student, AxiosErrorResponse, CreateStudentPayload>({
    mutationFn: async (payload) => {
      const userId = user?.id ?? "";
      const schoolId = user?.schoolId ?? "";
      const id = genId();
      const now = Date.now();

      await db.students.put({
        id,
        userId,
        name: payload.name,
        admissionNo: payload.admissionNo,
        classId: payload.classId,
        gender: payload.gender ?? null,
        dateOfBirth: payload.dateOfBirth ?? null,
        address: payload.address ?? null,
        imageUrl: payload.imageUrl ?? null,
        parentName: payload.parentName ?? null,
        parentPhone: payload.parentPhone ?? null,
        parentEmail: payload.parentEmail ?? null,
        status: "ACTIVE",
        schoolId,
        createdAt: now,
      });

      await addToQueue({
        userId,
        table: "students",
        recordId: id,
        endpoint: "/students",
        method: "POST",
        payload: { ...payload, id },
      });

      return { id, ...payload } as unknown as Student;
    },
    onSuccess: async () => {
      toast.success("Student added!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
