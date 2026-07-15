import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { Link } from "react-router";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../contexts/AuthContext";
import { useParentProfile, useChildrenWithDetails } from "../features/parent/api";
import { db } from "../db/db";

export const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  const studentIds = children.map((c) => c.id);

  const attendanceMap = useLiveQuery(
    () => db.attendance
      .filter((r) => studentIds.includes(r.studentId) && r.date.startsWith(thisMonth))
      .toArray(),
    [studentIds, thisMonth],
  );

  const childAttendance = useMemo(() => {
    if (!attendanceMap) return {};
    const map: Record<string, { present: number; absent: number; total: number }> = {};
    for (const r of attendanceMap) {
      if (!map[r.studentId]) map[r.studentId] = { present: 0, absent: 0, total: 0 };
      map[r.studentId].total++;
      if (r.status === "present" || r.status === "late") map[r.studentId].present++;
      else if (r.status === "absent") map[r.studentId].absent++;
    }
    return map;
  }, [attendanceMap]);

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
          <Link to="/settings" className="text-sm text-gray-500 hover:text-gray-700">Settings</Link>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Parent Portal</h2>
          <p className="text-sm text-gray-400 mt-1">
            {parent?.email} &middot; {parent?.phone ?? "No phone"}
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
        ) : !children.length ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-400">No children linked to your account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => {
              const att = childAttendance[child.id];
              return (
                <div
                  key={child.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={child.name} size={36} />
                        <div>
                          <h3 className="font-semibold text-gray-800">{child.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {child.admissionNo} &middot; {child.className ?? child.classId ?? "No class"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {child.className ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Class Teacher:{" "}
                      <span className="text-gray-700 font-medium">
                        {child.teacherName ?? "—"}
                      </span>
                    </span>
                  </div>

                  {att && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        Present: {att.present}
                      </span>
                      <span className="text-red-500 font-medium">
                        Absent: {att.absent}
                      </span>
                      <span className="text-gray-400">
                        This month: {att.total} days
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
