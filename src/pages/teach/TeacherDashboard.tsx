import { Link } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile } from "../../features/teacher/api";
import { FormClassCard, SubjectAssignmentsCard } from "../../features/teacher/components";

export const TeacherDashboard = () => {
  const { formClass, assignments, schoolName, name, role, isLoading } =
    useTeacherProfile();

  return (
    <div className="p-8 max-w-5xl">
      {isLoading && (
        <p className="text-sm text-gray-400 mb-4">Loading...</p>
      )}

      <div className="mb-1">
        <p className="text-xs text-gray-400">{schoolName}</p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">
          Welcome, {name}
        </h1>
      </div>

      <FormClassCard formClass={formClass} />
      <SubjectAssignmentsCard assignments={assignments} />

      {formClass && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link
            to="/teach/students"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Students</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              View class
            </p>
          </Link>
          <Link
            to="/teach/attendance"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Attendance</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              Mark today's
            </p>
          </Link>
          <Link
            to="/teach/lesson-notes"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Lesson Notes</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              Create / Edit
            </p>
          </Link>
        </div>
      )}
    </div>
  );
};
