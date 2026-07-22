import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";

interface FormClassResult {
  formClassId: string | null;
  formClass: string | null;
}

export const useMyFormClass = (userId: string) => {
  const data = useLiveQuery(
    () => (userId ? db.teacherFormClass.get(userId) : Promise.resolve(undefined)),
    [userId],
  );

  useQuery({
    queryKey: ["teacherFormClass", userId],
    queryFn: async () => {
      const res = await fetchData<{ formClassId?: string; formClass?: { id: string; name: string } | null }>("/teachers/form-class", "GET");
      await db.teacherFormClass.put({ id: userId, ...res }, userId);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const result: FormClassResult = data
    ? { formClassId: data.formClassId, formClass: data.formClass }
    : { formClassId: null, formClass: null };

  return {
    data: result,
    isLoading: data === undefined,
    error: undefined,
  };
};
