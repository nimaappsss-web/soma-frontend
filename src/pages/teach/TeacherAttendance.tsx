import { useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useTeacherProfile } from "../../features/teacher/api";
import { useAuth } from "../../contexts/AuthContext";
import { AttendanceListView } from "../../features/teacher/components/AttendanceListView";
import { AttendanceHistoryView } from "../../features/teacher/components/AttendanceHistoryView";
import { db } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import type { AttendanceStatus } from "../../features/teacher/types";

type Tab = "mark" | "history";
type ViewMode = "list" | "card";

export const TeacherAttendance = () => {
  const { user } = useAuth();
  const { formClass, formClassId, isLoading: profileLoading } = useTeacherProfile();

  const [tab, setTab] = useState<Tab>("mark");
  const [view, setView] = useState<ViewMode>("list");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const students = useLiveQuery(
    () =>
      formClassId
        ? db.students.where("classId").equals(formClassId).toArray()
        : [],
    [formClassId],
  );

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

  const handleSave = async () => {
    if (!formClassId || Object.keys(attendance).length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, status,
    }));

    const queueId = `attendance_${formClassId}_${today}`;
    await addToQueue({
      userId: user!.id,
      table: "attendance",
      recordId: queueId,
      endpoint: "/attendance/bulk",
      method: "POST",
      payload: { classId: formClassId, date: today, records },
    });

    setAttendance({});
  };

  if (profileLoading) {
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
              {tab === "mark" ? `${markedCount} / ${totalStudents} marked` : "View history"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setTab("mark")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "mark" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                Mark
              </button>
              <button
                onClick={() => setTab("history")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === "history" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                History
              </button>
            </div>
            {tab === "mark" && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    view === "list" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setView("card")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    view === "card" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                  }`}
                >
                  Cards
                </button>
              </div>
            )}
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
            <div className="flex justify-end mb-4">
              <button
                onClick={handleSave}
                disabled={markedCount === 0}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Save ({markedCount})
              </button>
            </div>

            {view === "card" ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Card view — swipe right for present, left for absent. (Late not available in card view.)
              </p>
            ) : (
              <AttendanceListView
                students={students}
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
