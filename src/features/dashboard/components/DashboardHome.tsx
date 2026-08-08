import { useCallback } from "react";
import {
  Profile2User,
  People,
  Book,
  Book1,
  Gift,
  MagicStar,
  Calendar,
} from "iconsax-react";

import { useDashboardStats } from "../api";
import { useSetupProgress } from "../api/useSetupProgress";
import { useAuth } from "../../../contexts/AuthContext";
import { useCelebrations } from "../../moments/api/useCelebrations";
import { useCalendarEvents } from "../../calendar/api";
import { ProgressSection } from "./ProgressSection";
import { SetupChecklist } from "./SetupChecklist";
import { AcademicsSection } from "./AcademicsSection";
import { OperationsSection } from "./OperationsSection";
import { TintedStatCard } from "./TintedStatCard";
import { AttendanceCard } from "./AttendanceCard";
import { DashboardCalendar } from "./DashboardCalendar";
import { localDateKey } from "../../../utils/date";

const formatN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const DashboardHome = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { completed, percentage, storedPercentage, markSeen } =
    useSetupProgress();
  const { data: celebrations } = useCelebrations();

  const today = localDateKey();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];
  const { data: eventsData } = useCalendarEvents({
    from: today,
    to: nextWeekStr,
  });

  const handleSeen = useCallback(() => {
    markSeen();
  }, [markSeen]);

  const isSetupComplete = percentage >= 100;
  const firstName = user?.name?.split(" ")[0];

  const birthdays =
    celebrations?.celebrations.filter((c) => c.type === "BIRTHDAY") ?? [];
  const anniversaries =
    celebrations?.celebrations.filter((c) => c.type === "WORK_ANNIVERSARY") ??
    [];
  const events = eventsData?.events ?? [];

  return (
    <div className="p-4 md:p-6 w-full">
      <ProgressSection
        percentage={percentage}
        storedPercentage={storedPercentage}
        onSeen={handleSeen}
        userName={firstName}
        complete={isSetupComplete}
      />
      {!isSetupComplete && <SetupChecklist completed={completed} />}

      {/* Main grid — middle column wider */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2fr_1.3fr] gap-5 mt-6">
        {/* Left: Stat cards */}
        <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white border border-gray100">
          <TintedStatCard
            label="Total Teachers"
            value={isLoading ? "—" : formatN(stats?.teachers.total ?? 0)}
            icon={<Profile2User size={18} color="#FFFFFF" />}
            bgColor="bg-[#F3EDFF]"
          />
          <TintedStatCard
            label="Total Parents"
            value={isLoading ? "—" : formatN(stats?.parents.total ?? 0)}
            icon={<People size={18} color="#FFFFFF" />}
            bgColor="bg-[#FFF8E1]"
          />
          <TintedStatCard
            label="Active Subjects"
            value={isLoading ? "—" : formatN(stats?.subjects.total ?? 0)}
            icon={<Book size={18} color="#FFFFFF" />}
            bgColor="bg-[#EBF0FF]"
          />
          <TintedStatCard
            label="Classes"
            value={isLoading ? "—" : formatN(stats?.classes.total ?? 0)}
            icon={<Book1 size={18} color="#FFFFFF" />}
            bgColor="bg-[#FFF0ED]"
          />
        </div>

        {/* Center column (wider) */}
        <div className="flex flex-col gap-5">
          <AttendanceCard stats={stats} isLoading={isLoading} />
          <div className="grid grid-cols-2 gap-5">
            <AcademicsSection />
            <OperationsSection stats={stats} isLoading={isLoading} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 h-full bg-white border border-gray100 rounded-3xl">
          {/* Calendar + Upcoming in one card */}
          <div className="bg-white rounded-2xl p-5">
            <DashboardCalendar />
            <div className="mt-5 pt-5 border-t border-gray100">
              <h3 className="text-base font-semibold text-gray900 mb-4">
                Upcoming
              </h3>
              <div className="space-y-5">
                {events.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray400 uppercase tracking-wide mb-2.5">
                      Calendar Events
                    </p>
                    <div className="space-y-2.5">
                      {events.slice(0, 3).map((e) => (
                        <div key={e.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-azure500 flex items-center justify-center shrink-0">
                            <Calendar size={16} color="#FFFFFF" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray900 truncate">
                              {e.title}
                            </p>
                            <p className="text-xs text-gray500 truncate">
                              {e.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {birthdays.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray400 uppercase tracking-wide mb-2.5">
                      Birthdays
                    </p>
                    <div className="space-y-2.5">
                      {birthdays.slice(0, 3).map((b) => (
                        <div key={b.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                            <Gift size={16} color="#DB2777" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray900 truncate">
                              {b.personName}
                            </p>
                            <p className="text-xs text-gray500 truncate">
                              {b.personRole.replace("_", " ")} · Turning {b.age}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {anniversaries.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray400 uppercase tracking-wide mb-2.5">
                      Work Anniversaries
                    </p>
                    <div className="space-y-2.5">
                      {anniversaries.slice(0, 3).map((a) => (
                        <div key={a.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <MagicStar size={16} color="#D97706" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray900 truncate">
                              {a.personName}
                            </p>
                            <p className="text-xs text-gray500 truncate">
                              {a.personRole.replace("_", " ")} ·{" "}
                              {a.yearsAtSchool} year
                              {a.yearsAtSchool === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {events.length === 0 &&
                  birthdays.length === 0 &&
                  anniversaries.length === 0 && (
                    <p className="text-sm text-gray400 text-center py-2">
                      Nothing upcoming
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
