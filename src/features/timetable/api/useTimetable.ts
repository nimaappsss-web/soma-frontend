import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { TimetableListResponse, AxiosErrorResponse, DayOfWeek } from "../types";

interface UseTimetableParams {
  classId?: string;
  day?: DayOfWeek;
}

export const useTimetable = ({ classId, day }: UseTimetableParams = {}) => {
  const params = new URLSearchParams();
  if (classId) params.set("classId", classId);
  if (day) params.set("day", day);

  return useQuery<TimetableListResponse, AxiosErrorResponse>({
    queryKey: timetableKeys.list(classId ?? "", day),
    queryFn: () => fetchData(`/timetable?${params.toString()}`, "GET"),
    enabled: !!classId,
  });
};
