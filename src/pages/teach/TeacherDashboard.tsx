import { Link } from "react-router";
import { User, Book, Check, CloseCircle, Timer1, Cake } from "iconsax-react";

import { useTeacherProfile, useAttendanceClassSummary } from "../../features/teacher/api";
import { useStudents } from "../../features/students/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTeacherTimetableCache } from "../../features/timetable/api";
import { TodayScheduleCard } from "../../features/timetable/components/TodayScheduleCard";
import { greetingFor, nextClass } from "../../features/timetable/utils/todaySchedule";
import { localDateKey } from "../../utils/date";
import { givenName } from "../../utils/name";
import { getCelebration } from "../../utils/celebrations";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
import { TintedStatCard } from "../../features/dashboard/components/TintedStatCard";
import { AttendanceCard } from "../../features/dashboard/components/AttendanceCard";
import { DashboardCalendar } from "../../features/dashboard/components/DashboardCalendar";
import { UpcomingCard } from "../../features/dashboard/components/UpcomingCard";
import { SubjectAssignmentsCard } from "../../features/teacher/components";

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const isLocked =
    user?.role?.toLowerCase() === "teacher" &&
    (user?.approvalStatus === "PENDING" || user?.approvalStatus === "REJECTED");
  const {
    formClass,
    formClassId,
    assignments,
    schoolName,
    name,
    isLoading,
  } = useTeacherProfile();
  const today = localDateKey();
  const { data: students, isLoading: studentsLoading } = useStudents(formClassId ?? "", "ACTIVE");
  const { data: classSummary } = useAttendanceClassSummary({
    classId: formClassId ?? "",
    from: today,
    to: today,
  });
  const { entries: teacherEntries, isLoading: ttLoading } = useTeacherTimetableCache(user?.id ?? "");
  const greeting = greetingFor(nextClass(teacherEntries));

  const firstName = givenName(name);
  const loading = isLoading || studentsLoading;

  const birthdayStudent = (students ?? []).find((s) => {
    const celeb = getCelebration(s.dateOfBirth, "birthday");
    return !!celeb;
  });
  const birthdayCeleb = birthdayStudent
    ? getCelebration(birthdayStudent.dateOfBirth, "birthday")
    : null;
  const birthdayFirst = birthdayStudent?.name?.split(" ")[0] ?? "";

  const attendanceStats = classSummary
    ? {
        attendance: {
          today: {
            present: classSummary.present ?? 0,
            absent: classSummary.absent ?? 0,
            percentage: classSummary.percentage ?? 0,
            dayOfWeek: "",
          },
          isHoliday: false,
        },
      }
    : undefined;

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header */}
      <div className="mb-1">
        <p className="text-sm text-gray500">{schoolName}</p>
        <h1 className="text-xl md:text-2xl font-bold text-gray900 mt-0.5">
          Hello{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray700">{greeting}</p>
      </div>

      {/* Pending approval banner */}
      {isLocked && (
        <div className="mt-6 mb-6 rounded-2xl border border-amber500/40 bg-amber500/10 p-5 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber500">
              <Timer1 size={26} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray900">
                Your account hasn't been approved yet
              </h2>
              <p className="mt-1.5 text-sm md:text-base text-gray700">
                {user?.approvalStatus === "REJECTED"
                  ? "Your account was declined by the principal. Please contact your school principal to resolve this."
                  : "Only the dashboard is available until you're approved. Please notify your school principal so they can activate your account."}
              </p>
            </div>
          </div>
        </div>
      )}

      {formClass && (
        <div className="mt-4 rounded-xl bg-gray900 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/50">Class Teacher</p>
              <p className="mt-0.5 text-lg font-semibold text-white">{formClass}</p>
            </div>
            <Link
              to="/teach/students"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              View class →
            </Link>
          </div>

          {birthdayStudent && birthdayCeleb && (
            <div className="relative mt-4 overflow-hidden rounded-2xl bg-white">
              <CelebrationDecor type="birthday" years={birthdayCeleb.years} />
              <div className="relative flex flex-col items-center px-5 pt-12 pb-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0ED] shadow-sm ring-1 ring-amber-500/20">
                  <Cake size={22} color="#D97706" variant="Bold" />
                </div>
                <p className="mt-3 text-base font-bold text-gray900">
                  Today is {birthdayFirst}'s birthday! 🎂
                </p>
                <p className="mt-1 text-xs text-gray600">
                  {birthdayCeleb.years >= 1
                    ? `Turning ${birthdayCeleb.years}. Don't forget to celebrate ${birthdayStudent.gender === "F" ? "her" : "him"} today.`
                    : `Don't forget to celebrate ${birthdayStudent.gender === "F" ? "her" : "him"} today.`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <TintedStatCard
          label="Students in My Class"
          value={loading ? "—" : String(students?.length ?? 0)}
          icon={<User size={18} color="#FFFFFF" />}
          bgColor="bg-[#EBF0FF]"
        />
        <TintedStatCard
          label="Subjects Assigned"
          value={isLoading ? "—" : String(assignments.length)}
          icon={<Book size={18} color="#FFFFFF" />}
          bgColor="bg-[#F3EDFF]"
        />
        <TintedStatCard
          label="Present Today"
          value={classSummary?.present !== undefined ? String(classSummary.present) : "—"}
          icon={<Check size={18} color="#FFFFFF" />}
          bgColor="bg-[#E8F8ED]"
        />
        <TintedStatCard
          label="Absent Today"
          value={classSummary?.absent !== undefined ? String(classSummary.absent) : "—"}
          icon={<CloseCircle size={18} color="#FFFFFF" />}
          bgColor="bg-[#FFF0ED]"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* Center */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <AttendanceCard stats={attendanceStats} isLoading={loading} />
          <SubjectAssignmentsCard assignments={assignments} />
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-gray100 bg-white p-5">
            <DashboardCalendar entries={teacherEntries} />
            <TodayScheduleCard entries={teacherEntries} isLoading={ttLoading} />
          </div>
          <UpcomingCard
            title="My Subjects"
            sections={[
              {
                label: "Assigned Subjects",
                items: assignments.slice(0, 4).map((a) => ({
                  id: a.id,
                  title: a.subject.name,
                  subtitle: a.classes.map((c) => c.name).join(", "),
                  icon: <Book size={14} color="#8C8C8C" />,
                })),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
