import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { parseLocalDate } from "../../../utils/date";
import { attendanceKeys } from "../utils/query-keys";
import type {
  AttendanceAvailability,
  AttendanceBlockedType,
  AttendanceReason,
  AxiosErrorResponse,
} from "../types";

type AvailabilityStatus = "loading" | "blocked" | "school-day";

interface AttendanceAvailabilityResult {
  status: AvailabilityStatus;
  reason?: AttendanceReason;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const blockedReason = (type: AttendanceBlockedType, message: string): AttendanceReason => ({
  available: false,
  type,
  message,
});

export const useAttendanceAvailability = (date: string): AttendanceAvailabilityResult => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const query = useQuery<AttendanceAvailability, AxiosErrorResponse>({
    queryKey: [...attendanceKeys.all, "availability", date],
    queryFn: () => fetchData(`/attendance/availability?date=${date}`, "GET"),
    enabled: !!userId && !!date,
    staleTime: 5 * 60 * 1000,
  });

  const holidays = useLiveQuery(
    () =>
      userId
        ? db.holidays.where("userId").equals(userId).toArray()
        : Promise.resolve([] as import("../../../db/db").HolidayCache[]),
    [userId],
  );

  const terms = useLiveQuery(
    () =>
      userId
        ? db.academicTerms.where("userId").equals(userId).toArray()
        : Promise.resolve([] as import("../../../db/db").AcademicTermCache[]),
    [userId],
  );

  if (query.data) {
    if (query.data.available) {
      return { status: "school-day" };
    }
    return {
      status: "blocked",
      reason: blockedReason(query.data.reason?.type ?? "HOLIDAY", query.data.reason?.message ?? "Not a school day"),
    };
  }

  const day = parseLocalDate(date);
  if (!day) {
    return { status: "blocked", reason: blockedReason("FUTURE", "Invalid date") };
  }

  const weekday = day.getDay();
  if (weekday === 0 || weekday === 6) {
    return { status: "blocked", reason: blockedReason("WEEKEND", DAY_NAMES[weekday]) };
  }

  if (holidays === undefined || terms === undefined) {
    return { status: "loading" };
  }

  const holiday = holidays.find((h) => h.date === date);
  if (holiday) {
    return { status: "blocked", reason: blockedReason("HOLIDAY", holiday.reason) };
  }

  const flaggedTerm = terms.find((t) => t.isCurrent);
  const activeTerm =
    flaggedTerm ??
    terms.find((t) => {
      const s = parseLocalDate(t.startDate);
      const e = parseLocalDate(t.endDate);
      return !!s && !!e && day >= s && day <= e;
    });

  if (terms.length > 0 && !activeTerm) {
    return { status: "blocked", reason: blockedReason("OUT_OF_TERM", "Outside the current academic term") };
  }

  return { status: "school-day" };
};
