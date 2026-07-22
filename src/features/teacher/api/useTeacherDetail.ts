import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";
import type { TeacherDetail } from "../types";

export const useTeacherDetail = (id: string) => {
  const data = useLiveQuery(
    () => (id ? db.teacherDetails.get(id) : Promise.resolve(undefined)),
    [id],
  );

  const parsed: TeacherDetail | undefined = data?.detailJson
    ? JSON.parse(data.detailJson)
    : undefined;

  return {
    data: parsed,
    isLoading: data === undefined,
    error: undefined,
  };
};
