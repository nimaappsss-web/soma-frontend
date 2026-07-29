import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { TimetableListResponse, AxiosErrorResponse } from "../types";

export const useTeacherTimetable = (teacherId: string) => {
  return useQuery<TimetableListResponse, AxiosErrorResponse>({
    queryKey: timetableKeys.teacher(teacherId),
    queryFn: () => fetchData(`/timetable/teacher/${teacherId}`, "GET"),
    enabled: !!teacherId,
  });
};
