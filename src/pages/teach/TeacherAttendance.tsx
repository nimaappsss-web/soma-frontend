import { useState, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile } from "../../features/teacher/api";
import { useStudents } from "../../features/students/api";
import { AttendanceListView } from "../../features/teacher/components/AttendanceListView";
import { AttendanceHistoryView } from "../../features/teacher/components/AttendanceHistoryView";
import { StudentSwipeCard } from "../../components/ui/StudentSwipeCard";
import { addToQueue } from "../../sync/syncQueue";
import { db } from "../../db/db";
import { fetchData } from "../../utils/fetchData";
import { Button } from "../../components/ui/button";
import type { AttendanceStatus } from "../../features/teacher/types";
import type { AttendanceQueryResponse } from "../../features/teacher/types";

type Tab = "mark" | "history";
type ViewMode = "list" | "card";

export const TeacherAttendance = () => {
  const { user } = useAuth();
  const { formClass, formClassId, isLoading: profileLoading } = useTeacherProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = tabParam === "history" ? "history" : "mark";
  const today = new Date().toISOString().split("T")[0];
  const [view, setView] = useState<ViewMode>("list");

  const handleTabChange = (newTab: Tab) => {
    if (newTab === "mark") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: "history" });
    }
  };

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [clearConfirm, setClearConfirm] = useState(false);
  const [modifyMode, setModifyMode] = useState(false);
  const [userMarked, setUserMarked] = useState(false);

  const initialized = useRef(false);

  const { data: students, isLoading: studentsLoading } = useStudents(formClassId ?? "", "ACTIVE");

  const cachedAttendance = useLiveQuery(
    () => formClassId ? db.attendance.where("[date+className]").equals([today, formClass ?? ""]).toArray() : [],
    [formClassId, today, formClass],
  );

  useQuery({
    queryKey: ["attendance", formClassId, today],
    queryFn: async () => {
      if (!formClassId) throw new Error("no class");
      const res = await fetchData<AttendanceQueryResponse>(
        `/attendance?classId=${formClassId}&date=${today}`,
        "GET",
      );
      if (res.records?.length) {
        const hasPending = await db.attendance
          .where("[date+className]").equals([today, formClass ?? ""])
          .filter((r) => r.syncStatus === "pending")
          .count();
        if (hasPending === 0) {
          await db.attendance
            .where("[date+className]").equals([today, formClass ?? ""])
            .delete();
          await db.attendance.bulkAdd(
            res.records.map((r) => ({
              id: r.id,
              studentId: r.studentId,
              className: formClass ?? "",
              schoolId: user?.schoolId ?? "",
              status: r.status,
              date: today,
              syncStatus: "synced" as const,
            createdAt: Date.now(),
            })),
          );
        }
      }
      return res;
    },
    enabled: !!formClassId,
    staleTime: 5 * 60 * 1000,
  });

  const hasSavedData = cachedAttendance !== undefined && cachedAttendance.length > 0;

  if (!initialized.current && hasSavedData && !userMarked) {
    initialized.current = true;
    const prefill: Record<string, AttendanceStatus> = {};
    for (const r of cachedAttendance) {
      prefill[r.studentId] = r.status;
    }
    setAttendance(prefill);
  }

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  };

  const handleUndo = (studentId: string) => {
    setAttendance((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleSave = async () => {
    if (!formClassId || Object.keys(attendance).length === 0) return;
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, status,
    }));

    const queueId = `attendance_${formClassId}_${today}`;
    await addToQueue({
      userId: formClassId,
      table: "attendance",
      recordId: queueId,
      endpoint: "/attendance/bulk",
      method: "POST",
      payload: { classId: formClassId, date: today, records },
    });

    await db.attendance.bulkPut(
      records.map((r) => ({
        id: `att_${formClassId}_${today}_${r.studentId}`,
        studentId: r.studentId,
        className: formClass ?? "",
        schoolId: user?.schoolId ?? "",
        status: r.status,
        date: today,
        syncStatus: "pending" as const,
        createdAt: Date.now(),
      })),
    );

    setModifyMode(false);
    setUserMarked(true);
  };

  const handleModify = () => {
    setModifyMode(true);
    setView("list");
    if (cachedAttendance?.length) {
      const prefill: Record<string, AttendanceStatus> = {};
      for (const r of cachedAttendance) {
        prefill[r.studentId] = r.status;
      }
      setAttendance(prefill);
    }
  };

  const handleClearAll = async () => {
    if (!formClassId) return;

    await db.attendance
      .where("[date+className]").equals([today, formClass ?? ""])
      .delete();

    await db.syncQueue
      .filter((i) => i.table === "attendance" && (i.status === "pending" || i.status === "failed"))
      .delete();

    await addToQueue({
      userId: formClassId,
      table: "attendance",
      recordId: `attendance_clear_${formClassId}_${today}`,
      endpoint: "/attendance/bulk",
      method: "DELETE",
      payload: { classId: formClassId, date: today },
    });

    setClearConfirm(false);
    setModifyMode(false);
    setAttendance({});
    setUserMarked(false);
  };

  const sortedStudents = useMemo(
    () => [...(students ?? [])].sort((a, b) => {
      const na = a.name?.toLowerCase() ?? "";
      const nb = b.name?.toLowerCase() ?? "";
      return na < nb ? -1 : na > nb ? 1 : 0;
    }),
    [students],
  );

  if (profileLoading || cachedAttendance === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!formClass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">You are not a class teacher.</p>
          <Link to="/teach" className="text-blue-600 hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const markedCount = Object.keys(attendance).length;
  const totalStudents = students?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-700">
              Attendance — {formClass}
            </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {tab === "history" ? "View history" : userMarked && !modifyMode ? "Marked for today" : `${markedCount} / ${totalStudents} marked`}
              </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => handleTabChange("mark")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "mark" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                Mark
              </button>
              <button
                onClick={() => handleTabChange("history")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "history" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                History
              </button>
            </div>
            <Link to="/teach" className="text-sm text-gray-500 hover:text-gray-700">
              &larr;
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        {tab === "history" ? (
          formClassId ? (
            <AttendanceHistoryView classId={formClassId} formClass={formClass} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No class assigned.</p>
          )
        ) : userMarked && !modifyMode ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm mx-auto text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance Marked</h3>
            <p className="text-sm text-gray-400 mb-2">
              {markedCount} students marked for today
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Tap Modify to change individual records
            </p>
            <div className="space-y-2">
              <Button onClick={handleModify} variant="outline" className="w-full">
                Modify
              </Button>
              {clearConfirm ? (
                <div className="flex gap-2">
                  <Button onClick={handleClearAll} variant="destructive" className="flex-1">
                    Yes, clear all
                  </Button>
                  <Button onClick={() => setClearConfirm(false)} variant="ghost" className="flex-1">
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="w-full text-xs text-red-400 hover:text-red-600 py-2 transition-colors"
                >
                  Clear all attendance for today
                </button>
              )}
            </div>
          </div>
        ) : studentsLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Loading students...</p>
          </div>
        ) : !students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-400">No students in this class yet.</p>
            <Link
              to="/teach/students"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              View Students
            </Link>
          </div>
        ) : (
          <>
            {view === "list" && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleSave}
                  disabled={markedCount === 0}
                >
                  Save ({markedCount})
                </Button>
              </div>
            )}

            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setView("card")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "card" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                Card View
              </button>
            </div>

            {view === "card" ? (
              <StudentSwipeCard
                students={sortedStudents}
                onSwipe={(studentId, status) => handleMark(studentId, status)}
                onUndo={handleUndo}
                onSave={handleSave}
                markedCount={markedCount}
                totalStudents={totalStudents}
              />
            ) : (
              <AttendanceListView
                students={sortedStudents}
                attendance={attendance}
                onMark={handleMark}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
