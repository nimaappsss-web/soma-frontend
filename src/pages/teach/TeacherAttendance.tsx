import { useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useTeacherProfile } from "../../features/teacher/api";
import { db } from "../../db/db";
import { StudentSwipeCard } from "../../components/ui/StudentSwipeCard";

type ViewMode = "list" | "card";

const CheckCircle = () => (
  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
  </svg>
);

const CancelCircle = () => (
  <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
  </svg>
);

export const TeacherAttendance = () => {
  const { formClass, isLoading } = useTeacherProfile();
  const [view, setView] = useState<ViewMode>("list");
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [lastSwipe, setLastSwipe] = useState<{ studentId: string; status: "present" | "absent" } | null>(null);

  const students = useLiveQuery(
    () =>
      formClass
        ? db.students.where("studentClass").equals(formClass).toArray()
        : [],
    [formClass],
  );

  const handleMark = (studentId: string, status: "present" | "absent") => {
    setAttendance((prev) => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  };

  const handleSwipe = (studentId: string, status: "present" | "absent") => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setLastSwipe({ studentId, status });
    setTimeout(() => setLastSwipe(null), 3000);
  };

  const handleUndo = () => {
    if (lastSwipe) {
      setAttendance((prev) => {
        const next = { ...prev };
        delete next[lastSwipe.studentId];
        return next;
      });
      setLastSwipe(null);
    }
  };

  const handleSave = async () => {
    if (!formClass || Object.keys(attendance).length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const entries = Object.entries(attendance).map(([studentId, status]) => ({
      id: `${studentId}_${today}_homeroom`,
      studentId,
      className: formClass,
      schoolId: "",
      status,
      date: today,
      syncStatus: "pending" as const,
      createdAt: Date.now(),
    }));
    await db.attendance.bulkPut(entries);
    setAttendance({});
    setLastSwipe(null);
  };

  if (isLoading) {
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-700">
            Attendance — {formClass}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {markedCount} / {totalStudents} marked
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Link
            to="/teach"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr;
          </Link>
        </div>
      </header>

      {!students || students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-400">No students in this class yet.</p>
          <Link
            to="/teach/students"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Add Students
          </Link>
        </div>
      ) : view === "card" ? (
        <div className="flex flex-col items-center px-4 pt-4">
          <div className="w-full max-w-md flex justify-end mb-2">
            <button
              onClick={handleSave}
              disabled={markedCount === 0}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save ({markedCount})
            </button>
          </div>
          <StudentSwipeCard
            key={markedCount}
            students={students}
            onSwipe={handleSwipe}
          />
        </div>
      ) : (
        <main className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleSave}
              disabled={markedCount === 0}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save ({markedCount})
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {students.map((s) => {
              const status = attendance[s.id];
              return (
                <div
                  key={s.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <span className="text-gray-800 font-medium text-sm">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMark(s.id, "present")}
                      className={`p-1 rounded-full transition-colors ${
                        status === "present" ? "bg-green-100" : "hover:bg-gray-100"
                      }`}
                    >
                      <CheckCircle />
                    </button>
                    <button
                      onClick={() => handleMark(s.id, "absent")}
                      className={`p-1 rounded-full transition-colors ${
                        status === "absent" ? "bg-red-100" : "hover:bg-gray-100"
                      }`}
                    >
                      <CancelCircle />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {lastSwipe && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center gap-4 shadow-lg">
          <span className="text-sm">
            {lastSwipe.status === "present" ? "✓ Marked Present" : "✗ Marked Absent"}
          </span>
          <button
            onClick={handleUndo}
            className="text-blue-400 hover:text-blue-300 font-semibold text-sm underline"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};
