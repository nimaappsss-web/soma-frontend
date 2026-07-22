import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import type { TeachersResponse } from "../types";

export const useTeachers = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const data = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve(undefined);
      return Promise.all([
        db.teachers.where("userId").equals(userId).toArray(),
        db.pendingInvites.where("userId").equals(userId).toArray(),
      ]);
    },
    [userId],
  );

  const result: TeachersResponse | undefined = data
    ? { teachers: data[0], pendingInvites: data[1] }
    : undefined;

  return {
    data: result,
    isLoading: data === undefined,
    error: undefined,
  };
};
