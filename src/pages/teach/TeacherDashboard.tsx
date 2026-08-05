import { Link } from "react-router";
import { ArrowRight } from "iconsax-react";

import { useTeacherProfile, useAttendanceClassSummary } from "../../features/teacher/api";
import { useStudents } from "../../features/students/api";
import { LargeStatCard } from "../../features/dashboard/components/LargeStatCard";
import { SmallStatCard } from "../../features/dashboard/components/SmallStatCard";
import { SubjectAssignmentsCard } from "../../features/teacher/components";
import { localDateKey } from "../../utils/date";

const QUICK_ACTIONS = [
  { label: "Students", to: "/teach/students" },
  { label: "Mark Attendance", to: "/teach/attendance" },
  { label: "Lesson Notes", to: "/teach/lesson-notes" },
  { label: "Results & Assessments", to: "/teach/ca-and-exams" },
];

const ActionRow = ({ label, to }: { label: string; to: string }) => (
  <Link to={to} className="group flex items-center justify-between py-1.5">
    <span className="text-sm text-gray700 transition-colors group-hover:text-gray900">
      {label}
    </span>
    <ArrowRight variant="Bold" size={14} color="#BBBBBB" />
  </Link>
);

export const TeacherDashboard = () => {
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

  const firstName = name?.split(" ")[0];
  const loading = isLoading || studentsLoading;
  const totalClasses = new Set(
    assignments.flatMap((a) => a.classes.map((c) => c.id)),
  ).size;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-1">
        <p className="text-sm text-gray500">{schoolName}</p>
        <h1 className="text-2xl font-bold text-gray900 mt-0.5">
          Hello, {firstName}
        </h1>
      </div>

      {formClass && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray900 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-white/50">Class Teacher</p>
            <p className="mt-0.5 text-lg font-semibold text-white">{formClass}</p>
          </div>
          <Link
            to="/teach/students"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            View class <ArrowRight size={14} color="#FFFFFF" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <LargeStatCard
          label="Students in My Class"
          value={loading ? "—" : String(students?.length ?? 0)}
        />
        <LargeStatCard
          label="Subjects Assigned"
          value={isLoading ? "—" : String(assignments.length)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <SmallStatCard label="Classes" value={String(totalClasses)} />
        <SmallStatCard
          label="Today's Attendance"
          value={classSummary?.percentage !== undefined ? `${classSummary.percentage}%` : "—"}
        />
        <SmallStatCard label="Present" value={String(classSummary?.present ?? 0)} />
        <SmallStatCard label="Absent" value={String(classSummary?.absent ?? 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <SubjectAssignmentsCard assignments={assignments} />
        <div className="bg-white rounded-xl border border-gray100 p-5">
          <h3 className="text-sm font-semibold text-gray900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <ActionRow key={action.to} {...action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
