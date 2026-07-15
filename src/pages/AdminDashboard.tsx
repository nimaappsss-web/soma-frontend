import { useState } from "react";
import { Link } from "react-router";

import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../contexts/AuthContext";
import { TeacherListSection } from "../features/principal/components/TeacherListSection";
import { Button } from "../components/ui/button";
import { InviteTeacherModal } from "../features/principal/components/InviteTeacherModal";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <Avatar name={user?.name ?? ""} size={24} className="inline-block align-middle" />
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/admin/students"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Students</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Manage</p>
          </Link>
          <Link
            to="/admin/teachers"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Teachers</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Manage</p>
          </Link>
          <Link
            to="/admin/classes"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Classes</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Manage</p>
          </Link>
          <Link
            to="/admin/subjects"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Subjects</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Manage</p>
          </Link>
          <Link
            to="/admin/parents"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Parents</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Manage</p>
          </Link>
          <Link
            to="/admin/settings"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Settings</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">School</p>
          </Link>
          <Link
            to="/admin/profile"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <p className="text-sm text-gray-400">Profile</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">Edit</p>
          </Link>
        </div>

        <TeacherListSection />

        <div className="flex justify-center mt-6">
          <Button onClick={() => setShowInvite(true)} size="sm">
            + Invite Teacher
          </Button>
        </div>
      </main>

      <InviteTeacherModal open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
};
