import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../db/db";

interface FormClassResult {
  formClassId: string | null;
  formClass: string | null;
}

export const useMyFormClass = (userId: string) => {
  const data = useLiveQuery(
    () => (userId ? db.teacherFormClass.get(userId) : Promise.resolve(undefined)),
    [userId],
  );

  const result: FormClassResult = data
    ? { formClassId: data.formClassId, formClass: data.formClass }
    : { formClassId: null, formClass: null };

  return {
    data: result,
    isLoading: data === undefined,
    error: undefined,
  };
};
