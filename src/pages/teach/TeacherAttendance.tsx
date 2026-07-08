import { useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useTeacherProfile } from "../../features/teacher/api";
import { db } from "../../db/db";

export const TeacherAttendance = () => {
  const { formClass, assignments, isLoading } = useTeacherProfile();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});

  const students = useLiveQuery(
    () =>
      formClass
        ? db.students.where("studentClass").equals(formClass).toArray()
        : [],
    [formClass],
  );

  const subjects = assignments.map((a) => a.subject);
  const currentStudents = selectedSubject && students ? students : [];

  const handleToggle = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      if (!current || current === "absent") return { ...prev, [studentId]: "present" as const };
      if (current === "present") return { ...prev, [studentId]: "late" as const };
      return { ...prev, [studentId]: "absent" as const };
    });
  };

  const handleSave = async () => {
    if (!formClass || !selectedSubject) return;
    const today = new Date().toISOString().split("T")[0];
    const entries = Object.entries(attendance).map(([studentId, status]) => ({
      id: `${studentId}_${today}_${selectedSubject}`,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Attendance</h1>
        <Link
          to="/teach"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setAttendance({});
            }}
            className="w-full max-w-xs h-10 rounded-md border border-gray-200 px-3 text-sm"
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              {currentStudents.length === 0 ? (
                <p className="text-sm text-gray-400 p-6 text-center">
                  No students in this class yet.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentStudents.map((s) => {
                    const status = attendance[s.id];
                    return (
                      <div
                        key={s.id}
                        className="px-6 py-3 flex items-center justify-between"
                      >
                        <span className="text-gray-800 font-medium">
                          {s.name}
                        </span>
                        <button
                          onClick={() => handleToggle(s.id)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                            !status
                              ? "border-gray-200 text-gray-400"
                              : status === "present"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : status === "late"
                                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {!status
                            ? "Tap to mark"
                            : status === "present"
                              ? "Present"
                              : status === "late"
                                ? "Late"
                                : "Absent"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {Object.keys(attendance).length > 0 && (
              <button
                onClick={handleSave}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                Save Attendance ({Object.keys(attendance).length})
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
};
