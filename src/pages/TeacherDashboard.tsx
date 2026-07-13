import { Link } from "react-router";

import { useAuth } from "../contexts/AuthContext";
import { useTeacherProfile } from "../features/teacher/api";
import { FormClassCard, SubjectAssignmentsCard } from "../features/teacher/components";

export const TeacherDashboard = () => {
  const { logout } = useAuth();
  const {
    formClass,
    assignments,
    schoolName,
    name,
    role,
    isLoading,
  } = useTeacherProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{schoolName}</span>
          <span className="text-sm text-gray-700">{name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {role}
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {isLoading && (
          <p className="text-sm text-gray-400 mb-4">Refreshing data...</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/attendance"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Attendance</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              Take today's
            </p>
          </Link>
          <Link
            to="/continuous-assessment"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Continuous Assessment</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              Record scores
            </p>
          </Link>
        </div>

        <FormClassCard formClass={formClass} />
        <SubjectAssignmentsCard assignments={assignments} />
      </main>
    </div>
  );
};
