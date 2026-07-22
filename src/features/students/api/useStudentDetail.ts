import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";
import type { Student } from "../types";

export const useStudentDetail = (id: string) => {
  const data = useLiveQuery(
    () => (id ? db.students.get(id) : Promise.resolve(undefined)) as Promise<Student | undefined>,
    [id],
  );

  return {
    data,
    isLoading: data === undefined,
    error: undefined,
  };
};
