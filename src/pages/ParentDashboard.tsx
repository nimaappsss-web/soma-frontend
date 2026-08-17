import { useMemo } from "react";
import { Link } from "react-router";
import { Calendar, CalendarAdd, Wallet3 } from "iconsax-react";

import {
  useParentProfile,
  useChildrenWithDetails,
  useParentAttendance,
} from "../features/parent/api";
import { useAnnouncements } from "../features/announcements/api";
import { useCalendarEvents } from "../features/calendar/api";
import { useAttendanceAvailability } from "../features/teacher/api";
import {
  AttendanceStatusPill,
  attendanceMonthSummary,
  type ChildAttendanceStatus,
} from "../features/parent/components/AttendanceStatus";
import { localDateKey } from "../utils/date";

export const ParentDashboard = () => {
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);
  const { records: attendance } = useParentAttendance({ days: 40 });

  const today = localDateKey();
  const thisMonth = today.slice(0, 7);

  const availability = useAttendanceAvailability(today);
  const notSchoolDay = availability.status === "blocked";
  const schoolDayReason = availability.reason?.message;

  const childTodayStatus = useMemo(() => {
    const map: Record<string, ChildAttendanceStatus> = {};
    for (const child of children) {
      const rec = attendance.find((r) => r.studentId === child.id && r.date === today);
      map[child.id] = rec ? (rec.status as ChildAttendanceStatus) : null;
    }
    return map;
  }, [attendance, children, today]);

  const childMonthSummary = useMemo(() => {
    const map: Record<string, { present: number; absent: number; total: number }> = {};
    for (const child of children) {
      map[child.id] = attendanceMonthSummary(
        attendance.filter((r) => r.studentId === child.id),
        thisMonth,
      );
    }
    return map;
  }, [attendance, children, thisMonth]);

  const presentToday = children.filter((c) => childTodayStatus[c.id] === "present").length;
  const absentToday = children.filter((c) => childTodayStatus[c.id] === "absent").length;

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray900">Parent Portal</h2>
        <p className="text-sm text-gray500 mt-1">{parent?.email}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray500 text-center py-12">Loading...</p>
      ) : !children.length ? (
        <div className="bg-white rounded-xl p-8 border border-gray100 text-center">
          <p className="text-gray500">No children linked to your account.</p>
        </div>
      ) : (
        <>
          {/* Today's attendance */}
          <section className="bg-white rounded-xl border border-gray100 p-5 md:p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray900">Today at school</h3>
              <span className="text-xs text-gray500">
                {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            {notSchoolDay ? (
              <div className="rounded-xl border border-gray100 bg-pureWhite p-4 text-sm text-gray600">
                Today is not a school day{schoolDayReason ? ` — ${schoolDayReason}` : ""}.
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {children.map((child) => {
                const status = childTodayStatus[child.id];
                const month = childMonthSummary[child.id];
                return (
                  <div
                    key={child.id}
                    className="rounded-xl border border-gray100 bg-pureWhite p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray900 truncate">{child.name}</p>
                        <p className="text-xs text-gray500 mt-0.5 truncate">
                          {child.admissionNo}
                          {child.className ? ` · ${child.className}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <AttendanceStatusPill status={status} />
                    </div>
                    <p className="text-xs text-gray400 mt-2">
                      This month: {month.present} present · {month.absent} absent
                    </p>
                  </div>
                );
              })}
            </div>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 pt-4 border-t border-gray50 text-sm">
              <span className="text-springgreen600 font-medium">
                {presentToday} present today
              </span>
              <span className="text-red500 font-medium">{absentToday} absent today</span>
              <Link to="/parent/children" className="text-gray500 hover:text-gray900 font-medium ml-auto">
                View full attendance &rarr;
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Upcoming events */}
            <UpcomingEvents />

            {/* School fees snapshot */}
            <section className="bg-white rounded-xl border border-gray100 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet3 size={18} color="#0D0D0D" />
                <h3 className="font-bold text-gray900">School Fees</h3>
              </div>
              <p className="text-sm text-gray500">
                View each child's fees, pay online, or check what you've already paid.
              </p>
              <Link
                to="/parent/fees"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray900 hover:text-gray600"
              >
                Go to school fees
                <span className="text-gray400">→</span>
              </Link>
            </section>
          </div>
        </>
      )}

      <AnnouncementsSection />
    </div>
  );
};

const UpcomingEvents = () => {
  const today = new Date();
  const from = today.toISOString().split("T")[0];
  const to = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, isLoading } = useCalendarEvents({ from, to });

  const events = useMemo(() => {
    const list = data?.events ?? [];
    return list
      .filter((e) => e.date.slice(0, 10) >= from)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [data, from]);

  return (
    <section className="bg-white rounded-xl border border-gray100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} color="#0D0D0D" />
        <h3 className="font-bold text-gray900">Upcoming events</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray500">Loading events...</p>
      ) : !events.length ? (
        <div className="flex flex-col items-center text-center py-6">
          <CalendarAdd size={28} color="#8C8C8C" />
          <p className="text-sm text-gray500 mt-2">No upcoming events.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray50">
          {events.map((e) => {
            const date = new Date(e.date.slice(0, 10));
            return (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <div className="w-10 shrink-0 text-center">
                  <p className="text-lg font-bold text-gray900 leading-none">
                    {date.getDate()}
                  </p>
                  <p className="text-[10px] uppercase text-gray400 mt-0.5">
                    {date.toLocaleDateString("en-NG", { month: "short" })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray900 truncate">{e.title}</p>
                  <p className="text-xs text-gray500 mt-0.5">
                    {date.toLocaleDateString("en-NG", { weekday: "long" })}
                    {e.description ? ` · ${e.description}` : ""}
                  </p>
                </div>
                <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-azure500/10 text-azure500 shrink-0">
                  {e.type === "HOLIDAY" ? "Holiday" : e.type.charAt(0) + e.type.slice(1).toLowerCase()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const AnnouncementsSection = () => {
  const { data, isLoading } = useAnnouncements({ limit: 10 });
  const announcements = data?.announcements ?? [];

  if (!announcements.length && !isLoading) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray900 mb-3">Announcements</h2>
      {isLoading ? (
        <p className="text-sm text-gray500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray900">{a.title}</span>
              </div>
              <p className="text-sm text-gray600 whitespace-pre-wrap">{a.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray500">
                <span>{a.createdBy.name}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};