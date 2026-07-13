import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { teacherKeys } from "../utils/query-keys";
import { db } from "../../../db/db";

interface FormClassResult {
  formClassId: string | null;
  formClass: string | null;
}

export const useMyFormClass = (userId: string) => {
  const [cached, setCached] = useState<FormClassResult | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(() => db.teacherFormClass.get(userId)).subscribe({
      next: (data) => {
        if (data) {
          setCached({ formClassId: data.formClassId, formClass: data.formClass });
        } else {
          setCached(undefined);
        }
      },
    });
    return () => sub.unsubscribe();
  }, [userId]);

  const query = useQuery<FormClassResult>({
    queryKey: teacherKeys.detail(userId),
    queryFn: async () => {
      const res: { formClassId?: string | null; formClass?: { id: string; name: string; level: string; arm?: string } | null } = await fetchData("/teachers/form-class", "GET");
      const result: FormClassResult = {
        formClassId: res?.formClassId ?? res?.formClass?.id ?? null,
        formClass: res?.formClass?.name ?? null,
      };
      await db.teacherFormClass.put({
        id: userId,
        formClassId: result.formClassId,
        formClass: result.formClass,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!userId,
  });

  return {
    data: cached ?? query.data ?? { formClassId: null, formClass: null },
    isLoading: query.isLoading && cached === undefined,
    error: query.error,
  };
};
