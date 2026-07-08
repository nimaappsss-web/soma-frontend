import { useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useTeacherProfile } from "../../features/teacher/api";
import { db } from "../../db/db";

export const TeacherStudents = () => {
  const { formClass, isLoading } = useTeacherProfile();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  const students = useLiveQuery(
    () =>
      formClass
        ? db.students.where("studentClass").equals(formClass).toArray()
        : [],
    [formClass],
  );

  const handleAdd = async () => {
    if (!newName.trim() || !formClass) return;
    await db.students.add({
      id: crypto.randomUUID(),
      name: newName.trim(),
      studentClass: formClass,
      schoolId: "",
      createdAt: Date.now(),
    });
    setNewName("");
    setShowForm(false);
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
          <Link
            to="/teach"
            className="text-blue-600 hover:underline text-sm"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Nima</h1>
        <Link
          to="/teach"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{formClass}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {students?.length ?? 0} student{(students?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Add Student
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className="flex-1 h-10 rounded-md border border-gray-200 px-3 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {!students || students.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">
              No students yet. Add the first one.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <span className="text-gray-800 font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
