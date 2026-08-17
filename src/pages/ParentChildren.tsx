import { useMemo, useState } from "react";
import { ArrowDown2 } from "iconsax-react";

import { cn } from "@/lib/utils";
import { useParentProfile, useChildrenWithDetails, useParentAttendance } from "../features/parent/api";
import {
  AttendanceStatusPill,
  attendanceStatusLabel,
} from "../features/parent/components/AttendanceStatus";
import { localDateKey } from "../utils/date";

export const ParentChildren = () => {
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);
  const { records: attendance } = useParentAttendance({ days: 40 });
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = localDateKey();
  const thisMonth = today.slice(0, 7);

  const byStudent = useMemo(() => {
    const map: Record<string, typeof attendance> = {};
    for (const r of attendance) {
      if (!map[r.studentId]) map[r.studentId] = [];
      map[r.studentId].push(r);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [attendance]);

  const todayStatusFor = (studentId: string) => {
    const rec = attendance.find((r) => r.studentId === studentId && r.date === today);
    return rec ? rec.status : null;
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray900">My Children</h2>
        <p className="text-sm text-gray500 mt-1">{parent?.email}</p>
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
            const todayStatus = todayStatusFor(child.id);
            const isOpen = expanded === child.id;
            const monthRecords = byStudent[child.id]?.filter((r) => r.date.startsWith(thisMonth)) ?? [];

            return (
              <div
                key={child.id}
                className="bg-white rounded-xl border border-gray100 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : child.id)}
                  className="w-full text-left px-6 py-4 border-b border-gray50 hover:bg-gray50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray900 truncate">{child.name}</h3>
                        <p className="text-xs text-gray500 mt-0.5 truncate">
                          {child.admissionNo} &middot; {child.className ?? child.classId ?? "No class"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-flex">
                        <AttendanceStatusPill status={todayStatus} />
                      </span>
                      <span className="sm:hidden text-xs font-medium rounded-full bg-gray50 text-gray700 px-2.5 py-1">
                        {attendanceStatusLabel(todayStatus)}
                      </span>
                      <ArrowDown2
                        size={16}
                        color="#8C8C8C"
                        className={cn("transition-transform", isOpen && "rotate-180")}
                      />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray500 mb-3">
                      Class Teacher:{" "}
                      <span className="text-gray700 font-medium">{child.teacherName ?? "—"}</span>
                    </p>

                    {/* Today */}
                    <div className="rounded-xl border border-gray100 bg-pureWhite p-4 mb-4">
                      <p className="text-xs text-gray400 mb-1.5">Today</p>
                      <AttendanceStatusPill status={todayStatus} />
                      <p className="text-xs text-gray400 mt-2">
                        {todayStatus === "present" && `${child.name.split(" ")[0]} was present in school today.`}
                        {todayStatus === "late" && `${child.name.split(" ")[0]} came late to school today.`}
                        {todayStatus === "absent" && `${child.name.split(" ")[0]} was absent today.`}
                        {todayStatus === null && "No attendance has been marked for today yet."}
                      </p>
                    </div>

                    {/* This month */}
                    <p className="text-sm font-semibold text-gray900 mb-2">
                      This month ({new Date().toLocaleDateString("en-NG", { month: "long", year: "numeric" })})
                    </p>
                    {monthRecords.length === 0 ? (
                      <p className="text-sm text-gray400">No attendance records this month.</p>
                    ) : (
                      <div className="divide-y divide-gray50">
                        {monthRecords.slice(0, 15).map((r) => (
                          <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                            <span className="text-gray700">
                              {new Date(r.date).toLocaleDateString("en-NG", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                r.status === "present" && "bg-green-50 text-springgreen600",
                                r.status === "late" && "bg-amber-300/30 text-amber600",
                                r.status === "absent" && "bg-red-50 text-red500",
                              )}
                            >
                              {r.status === "present" ? "Present" : r.status === "late" ? "Late" : "Absent"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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