import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db, type TeacherFormClassCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";

interface FormClassResult {
  formClassId: string | null;
  formClass: string | null;
}

export const useMyFormClass = (userId: string) => {
  const liveData = useLiveQuery(
    () => (userId ? db.teacherFormClass.get(userId) : Promise.resolve(undefined)),
    [userId],
  ) as TeacherFormClassCache | undefined;

  const query = useQuery({
    queryKey: ["teacherFormClass", userId],
    queryFn: async () => {
      const res = await fetchData<{ formClassId?: string | null; formClass?: { id: string; name: string } | null }>("/teachers/form-class", "GET");
      await db.teacherFormClass.put({
        id: userId,
        formClassId: res?.formClassId ?? res?.formClass?.id ?? null,
        formClass: res?.formClass?.name ?? null,
      }, userId);
      return res;
    },
    enabled: !!userId,
    staleTime: 0,
  });

  const apiHasData = query.data !== undefined;
  const apiFormClassId = query.data ? (query.data.formClassId ?? query.data.formClass?.id ?? null) : undefined;
  const apiFormClass = query.data ? (query.data.formClass?.name ?? null) : undefined;

  let result: FormClassResult;
  if (apiFormClassId !== undefined) {
    result = { formClassId: apiFormClassId, formClass: apiFormClass ?? null };
  } else if (liveData) {
    result = { formClassId: liveData.formClassId, formClass: liveData.formClass };
  } else {
    result = { formClassId: null, formClass: null };
  }

  const isLoading = liveData === undefined && !apiHasData && query.isLoading && !query.isError;

  return {
    data: result,
    isLoading,
    error: query.error ?? undefined,
  };
};
