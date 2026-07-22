import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import type { ParentCache } from "../../../db/db";
import type { Parent } from "../types";

export const useParents = (page = 1, _limit = 50) => {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const data = useLiveQuery(
    () => db.parents.toArray() as Promise<ParentCache[]>,
    [],
  );

  const filtered = data
    ? schoolId
      ? (data as Parent[]).filter((p) => p.schoolId === schoolId)
      : (data as Parent[])
    : [];

  return {
    data: filtered.length > 0
      ? { parents: filtered, total: filtered.length, page, totalPages: 1 }
      : undefined,
    isLoading: data === undefined,
    error: undefined,
  };
};
