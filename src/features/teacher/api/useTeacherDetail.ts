import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { TeacherDetail } from "../types";

export const useTeacherDetail = (id: string) => {
  const { user } = useAuth();
  const data = useLiveQuery(
    () => (id && user?.id ? db.teacherDetails.where({ id, userId: user.id }).first() : Promise.resolve(undefined)),
    [id, user?.id],
  );

  useQuery({
    queryKey: ["teacherDetail", id],
    queryFn: async () => {
      const res = await fetchData(`/teachers/${id}`, "GET");
      await db.teacherDetails.put({ id, userId: user?.id ?? "", detailJson: JSON.stringify(res) }, id);
      return res;
    },
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const parsed: TeacherDetail | undefined = data?.detailJson
    ? JSON.parse(data.detailJson)
    : undefined;

  return {
    data: parsed,
    isLoading: data === undefined,
    error: undefined,
  };
};
