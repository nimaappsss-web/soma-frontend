import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { addToQueue } from "../../../sync/syncQueue";
import { db } from "../../../db/db";
import { classSubjectKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, SaveClassSubjectsPayload } from "../types";

export const useSaveClassSubjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<undefined, AxiosErrorResponse, SaveClassSubjectsPayload>({
    mutationFn: async ({ classIds, subjectIds }) => {
      if (!user) return;

      await db.transaction("rw", db.classSubjects, async () => {
        for (const classId of classIds) {
          if (subjectIds.length > 0) {
            await db.classSubjects.put({
              id: classId,
              userId: user.id,
              classId,
              subjectIds,
              schoolId: user.schoolId ?? "",
              updatedAt: Date.now(),
            });
          } else {
            await db.classSubjects.delete(classId);
          }
        }
      });

      if (classIds.length > 0) {
        await addToQueue({
          userId: user.id,
          table: "classSubjects",
          recordId: classIds.slice().sort().join("+"),
          endpoint: "/subject-assignments",
          method: "PUT",
          payload: { classIds, subjectIds },
        });
      }
    },
    onSuccess: async () => {
      toast.success("Subjects assigned!");
      queryClient.invalidateQueries({ queryKey: classSubjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classSubjectKeys.list(user?.schoolId) });
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};