import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { calendarKeys } from "../utils/query-keys";
import type { CalendarEvent, AxiosErrorResponse } from "../types";

export const useCalendarEventDetail = (id: string) => {
  return useQuery<CalendarEvent, AxiosErrorResponse>({
    queryKey: calendarKeys.event(id),
    queryFn: () => fetchData(`/calendar/events/${id}`, "GET"),
    enabled: !!id,
  });
};
