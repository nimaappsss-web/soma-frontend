import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../contexts/AuthContext";
import { useParentProfile, useChildrenWithDetails } from "../features/parent/api";
import { db } from "../db/db";

export const ParentChildren = () => {
  const { user } = useAuth();
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  const studentIds = children.map((c) => c.id);

  const attendanceMap = useLiveQuery(
    () => db.attendance
      .where("userId").equals(user!.id)
      .filter((r) => studentIds.includes(r.studentId) && r.date.startsWith(thisMonth))
      .toArray(),
    [user?.id, studentIds, thisMonth],
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
    <div className="w-full px-6 py-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray900">My Children</h2>
        <p className="text-sm text-gray500 mt-1">
          {parent?.email}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray500 text-center py-12">Loading...</p>
      ) : !children.length ? (
        <div className="bg-white rounded-xl p-8 border border-gray100 text-center">
          <p className="text-gray500">No children linked to your account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child) => {
            const att = childAttendance[child.id];
            return (
              <div
                key={child.id}
                className="bg-white rounded-xl border border-gray100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray900">{child.name}</h3>
                        <p className="text-xs text-gray500 mt-0.5">
                          {child.admissionNo} &middot; {child.className ?? child.classId ?? "No class"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-azure100 text-azure500 px-2 py-1 rounded-full font-medium">
                      {child.className ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-3 flex items-center justify-between text-sm">
                  <span className="text-gray500">
                    Class Teacher:{" "}
                    <span className="text-gray700 font-medium">
                      {child.teacherName ?? "—"}
                    </span>
                  </span>
                </div>

                {att && (
                  <div className="px-6 py-3 bg-pureWhite border-t border-gray100 flex gap-4 text-sm">
                    <span className="text-springgreen600 font-medium">
                      Present: {att.present}
                    </span>
                    <span className="text-red500 font-medium">
                      Absent: {att.absent}
                    </span>
                    <span className="text-gray500">
                      This month: {att.total} days
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};