import { useMemo, useState } from "react";
import { ArrowDown2, TickCircle, CloseCircle, Clock, Teacher } from "iconsax-react";

import { cn } from "@/lib/utils";
import { useParentProfile, useChildrenWithDetails, useParentAttendance } from "../features/parent/api";
import {
  AttendanceStatusPill,
  type ChildAttendanceStatus,
} from "../features/parent/components/AttendanceStatus";
import { localDateKey } from "../utils/date";

const STATUS_DOT: Record<Exclude<ChildAttendanceStatus, null>, { bg: string; icon: typeof TickCircle; color: string; label: string }> = {
  present: { bg: "bg-[#E9F7EE]", icon: TickCircle, color: "#34A853", label: "Present" },
  late: { bg: "bg-amber-300/20", icon: Clock, color: "#FBBC05", label: "Late" },
  absent: { bg: "bg-[#FFF0ED]", icon: CloseCircle, color: "#CD432F", label: "Absent" },
};

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

  const monthStatsFor = (studentId: string) => {
    const monthRecords = byStudent[studentId]?.filter((r) => r.date.startsWith(thisMonth)) ?? [];
    const present = monthRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const absent = monthRecords.filter((r) => r.status === "absent").length;
    return { present, absent, total: monthRecords.length };
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">My Children</h1>
        <p className="text-sm text-gray500 mt-1">
          {parent?.email} &middot; {children.length} linked {children.length === 1 ? "child" : "children"}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray500 text-center py-12">Loading...</p>
      ) : !children.length ? (
        <div className="bg-white rounded-2xl p-10 border border-gray100 text-center">
          <p className="text-gray500">No children linked to your account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child) => {
            const todayStatus = todayStatusFor(child.id);
            const isOpen = expanded === child.id;
            const monthRecords = byStudent[child.id]?.filter((r) => r.date.startsWith(thisMonth)) ?? [];
            const stats = monthStatsFor(child.id);
            const dot = todayStatus ? STATUS_DOT[todayStatus] : null;

            return (
              <div
                key={child.id}
                className="bg-white rounded-3xl border border-gray100 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : child.id)}
                  className="w-full text-left px-5 md:px-6 py-4 border-b border-gray50 hover:bg-gray50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray900 truncate">{child.name}</h3>
                      <p className="text-xs text-gray500 mt-0.5 truncate">
                        {child.admissionNo} &middot; {child.className ?? child.classId ?? "No class"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0",
                        isOpen ? "bg-gray900" : "bg-gray50",
                      )}
                    >
                      <ArrowDown2
                        size={15}
                        color={isOpen ? "#FFFFFF" : "#8C8C8C"}
                        variant="Bold"
                        className={cn("transition-transform", isOpen && "rotate-180")}
                      />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray500">
                      <span className="w-2 h-2 rounded-full bg-springgreen600" />
                      {stats.present} present
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray500">
                      <span className="w-2 h-2 rounded-full bg-red500" />
                      {stats.absent} absent
                    </span>
                    <span className="inline-flex sm:ml-auto">
                      <AttendanceStatusPill status={todayStatus} />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 md:px-6 py-4">
                    {/* Class teacher chip */}
                    <div className="flex items-center gap-2 text-sm text-gray500 mb-4">
                      <span className="w-7 h-7 rounded-lg bg-[#F3EDFF] flex items-center justify-center">
                        <Teacher size={14} color="#8C37C3" variant="Bold" />
                      </span>
                      <span>
                        Class teacher:{" "}
                        <span className="text-gray700 font-medium">{child.teacherName ?? "—"}</span>
                      </span>
                    </div>

                    {/* Today */}
                    <div className="rounded-2xl border border-gray100 bg-pureWhite p-4 mb-4 flex items-center gap-3">
                      {dot && (
                        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", dot.bg)}>
                          <dot.icon size={18} color={dot.color} variant="Bold" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-gray400 mb-0.5">Today</p>
                        <p className="text-sm text-gray700">
                          {todayStatus === "present" && `${child.name.split(" ")[0]} was present in school today.`}
                          {todayStatus === "late" && `${child.name.split(" ")[0]} came late to school today.`}
                          {todayStatus === "absent" && `${child.name.split(" ")[0]} was absent today.`}
                          {todayStatus === null && "No attendance has been marked for today yet."}
                        </p>
                      </div>
                    </div>

                    {/* This month */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray900">
                        This month ({new Date().toLocaleDateString("en-NG", { month: "long", year: "numeric" })})
                      </p>
                      {stats.total > 0 && (
                        <p className="text-xs text-gray500">
                          {stats.present} present &middot; {stats.absent} absent &middot; {stats.total} days
                        </p>
                      )}
                    </div>
                    {monthRecords.length === 0 ? (
                      <p className="text-sm text-gray400">No attendance records this month.</p>
                    ) : (
                      <div className="divide-y divide-gray50">
                        {monthRecords.slice(0, 15).map((r) => {
                          const st = r.status as Exclude<ChildAttendanceStatus, null>;
                          const meta = STATUS_DOT[st];
                          const Icon = meta.icon;
                          return (
                            <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                              <span className="text-gray700">
                                {new Date(r.date).toLocaleDateString("en-NG", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray600">
                                <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center", meta.bg)}>
                                  <Icon size={13} color={meta.color} variant="Bold" />
                                </span>
                                {meta.label}
                              </span>
                            </div>
                          );
                        })}
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