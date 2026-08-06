import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import type { Student as StudentCache } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import type {
  UpdateStudentPayload,
  Student,
  AxiosErrorResponse,
} from "../types";

const TIMEOUT = 3000;

export const useUpdateStudent = () => {
  const { user } = useAuth();

  return useMutation<
    Student,
    AxiosErrorResponse,
    { id: string; data: UpdateStudentPayload }
  >({
    mutationFn: async ({ id, data }) => {
      const result = await Promise.race([
        (async () => {
          const existing = await db.students.where({ id, userId: user!.id }).first();
          const merged = {
            ...existing,
            ...data,
            userId: user!.id,
            createdAt: Date.now(),
          } as StudentCache;
          await db.students.put(merged, id);
          await addToQueue({
            userId: user!.id,
            table: "students",
            recordId: id,
            endpoint: `/students/${id}`,
            method: "PATCH",
            payload: data,
          });
          return merged as Student;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Dexie operation timed out")), TIMEOUT),
        ),
      ]);
      return result;
    },
    onSuccess: async () => {
      toast.success("Student updated!");
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
