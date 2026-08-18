import { useMemo } from "react";
import { Link } from "react-router";
import { People, Wallet3, ArrowRight } from "iconsax-react";

import {
  useParentProfile,
  useChildrenWithDetails,
  useParentAttendance,
  useAllParentFees,
} from "../features/parent/api";
import { useAnnouncements } from "../features/announcements/api";
import { useCalendarEvents } from "../features/calendar/api";
import { useAttendanceAvailability } from "../features/teacher/api";
import { givenName } from "../utils/name";
import { localDateKey } from "../utils/date";
import { formatNaira } from "../features/finance/utils/currency";
import { TintedStatCard } from "../features/dashboard/components/TintedStatCard";
import { ParentUpcomingCard } from "../features/parent/components/ParentUpcomingCard";
import { AnnouncementCard } from "../features/announcements/components/AnnouncementCard";
import { AttendanceStatusPill, type ChildAttendanceStatus } from "../features/parent/components/AttendanceStatus";
import { SomaLoader, parentLoadingDescriptions, feesLoadingDescriptions } from "../components/ui/SomaLoader";
import { useAuth } from "../contexts/AuthContext";

const formatN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const ParentDashboard = () => {
  const { user } = useAuth();
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);
  const { records: attendance } = useParentAttendance({ days: 40 });
  const allFees = useAllParentFees();

  const today = localDateKey();

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

  const firstName = givenName(parent?.name ?? user?.name);

  const overallProgress = allFees.totalFee > 0 ? (allFees.paid / allFees.totalFee) * 100 : 0;

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">
          Hello{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-gray500 mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12">
          <SomaLoader descriptions={parentLoadingDescriptions} />
        </div>
      ) : !children.length ? (
        <div className="bg-white rounded-2xl p-10 border border-gray100 text-center">
          <div className="w-12 h-12 rounded-full bg-gray50 flex items-center justify-center mx-auto mb-3">
            <People size={22} color="#8C8C8C" />
          </div>
          <p className="text-gray500">No children linked to your account yet.</p>
        </div>
      ) : (
        <div className="mt-2">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TintedStatCard
              label="My Children"
              value={formatN(children.length)}
              icon={<People size={18} color="#FFFFFF" />}
              bgColor="bg-[#F3EDFF]"
            />
            <TintedStatCard
              label="Fees Outstanding"
              value={formatNaira(allFees.outstanding)}
              icon={<Wallet3 size={18} color="#FFFFFF" variant="Bold" />}
              bgColor="bg-[#EBF0FF]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.3fr] gap-5 mt-5">
            {/* Main column */}
            <div className="flex flex-col gap-5">
              {/* Today at school */}
            <section className="bg-white rounded-3xl border border-gray100 p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-semibold text-gray900">Today at school</h3>
                {notSchoolDay && (
                  <span className="text-xs font-medium bg-amber-300/20 text-amber600 px-2.5 py-1 rounded-full shrink-0">
                    Not a school day
                  </span>
                )}
              </div>
              {notSchoolDay ? (
                <div className="rounded-2xl border border-gray100 bg-pureWhite p-5 text-sm text-gray600">
                  Today is not a school day{schoolDayReason ? ` — ${schoolDayReason}` : ""}.
                </div>
              ) : (
                <div className="divide-y divide-gray50">
                  {children.map((child) => (
                    <div key={child.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gray900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray900 truncate">{child.name}</p>
                          <p className="text-xs text-gray500 mt-0.5 truncate">
                            {child.className ?? child.classId ?? "No class"}
                          </p>
                          {child.teacherName && (
                            <p className="text-xs text-gray400 mt-0.5 truncate">
                              Class teacher: <span className="text-gray600 font-medium">{child.teacherName}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="sm:ml-auto shrink-0">
                        <AttendanceStatusPill status={childTodayStatus[child.id]} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/parent/children"
                className="mt-4 pt-3 border-t border-gray50 flex items-center justify-between text-sm font-medium text-gray900 hover:text-gray600 transition-colors"
              >
                View attendance
                <ArrowRight size={15} color="#0D0D0D" variant="Bold" />
              </Link>
            </section>

            {/* Fees summary */}
            <section className="bg-white rounded-3xl border border-gray100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#EBF0FF] flex items-center justify-center">
                  <Wallet3 size={16} color="#4285F4" variant="Bold" />
                </div>
                <h3 className="text-base font-semibold text-gray900">School Fees</h3>
              </div>
              {allFees.isLoading ? (
                <SomaLoader label="Loading fees" descriptions={feesLoadingDescriptions} className="h-8 w-8" />
              ) : allFees.totalFee <= 0 ? (
                <p className="text-sm text-gray400 py-2">No fees have been set up yet.</p>
              ) : (
                <div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray500">Outstanding</p>
                      <p className="text-2xl font-bold text-gray900 mt-0.5">
                        {formatNaira(allFees.outstanding)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray500">Paid</p>
                      <p className="text-sm font-semibold text-springgreen600 mt-0.5">
                        {formatNaira(allFees.paid)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray100 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-gray900 rounded-full" style={{ width: `${Math.min(100, overallProgress)}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray500">
                    <span>{Math.round(overallProgress)}% paid</span>
                    <span>{formatNaira(allFees.totalFee)} total</span>
                  </div>
                </div>
              )}
              <Link
                to="/parent/fees"
                className="mt-4 pt-3 border-t border-gray50 flex items-center justify-between text-sm font-medium text-gray900 hover:text-gray600 transition-colors"
              >
                View school fees
                <ArrowRight size={15} color="#0D0D0D" variant="Bold" />
              </Link>
            </section>
            </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <UpcomingEvents />
          </div>
        </div>
        </div>
      )}

      <AnnouncementsSection />
    </div>
  );
};

const UpcomingEvents = () => {
  const today = localDateKey();
  const to = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`;

  const { data, isLoading } = useCalendarEvents({ from: today, to: toStr });

  const events = useMemo(() => {
    const list = data?.events ?? [];
    return list
      .filter((e) => e.date.slice(0, 10) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, today]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray100 p-5">
        <h3 className="text-base font-semibold text-gray900 mb-2">Upcoming</h3>
        <p className="text-sm text-gray400">Loading events…</p>
      </div>
    );
  }

  return <ParentUpcomingCard events={events} />;
};

const AnnouncementsSection = () => {
  const { data, isLoading } = useAnnouncements({ limit: 10 });
  const announcements = data?.announcements ?? [];

  if (!announcements.length && !isLoading) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray900 mb-3">Announcements</h2>
      {isLoading ? (
        <SomaLoader className="h-8 w-8" descriptions={parentLoadingDescriptions} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  );
};