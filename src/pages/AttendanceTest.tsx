import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";

import { db } from "../db/db";
import { StudentSwipeCard } from "../components/ui/StudentSwipeCard";

interface SwipeState {
  studentId: string;
  status: "present" | "absent";
  index: number;
  timestamp: number;
}

export const AttendanceTest = () => {
  const students = useLiveQuery(() => db.students.toArray());
  const [lastSwipe, setLastSwipe] = useState<SwipeState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (lastSwipe) {
      const timer = setTimeout(() => {
        setLastSwipe(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastSwipe]);

  const handleSwipe = (id: string, status: "present" | "absent") => {
    console.log(`Student ${id} marked as ${status}`);
    setLastSwipe({
      studentId: id,
      status,
      index: currentIndex,
      timestamp: Date.now(),
    });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (lastSwipe) {
      console.log(
        `Undoing: ${lastSwipe.studentId} was marked as ${lastSwipe.status}`,
      );
      setCurrentIndex(lastSwipe.index);
      setLastSwipe(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        Nima — Dexie Test
      </h1>

      <h2 className="font-semibold mb-2">Students in DB:</h2>
      {students?.length === 0 && (
        <p className="text-gray-400">No students yet</p>
      )}
      <ul className="space-y-2">
        {students?.map((student) => (
          <li
            key={student.id}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
          >
            <span className="font-medium">{student.name}</span>
            <span className="text-gray-400 ml-2">{student.studentClass}</span>
          </li>
        ))}
      </ul>

      <button
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        onClick={() =>
          db.students.add({
            id: Date.now().toString(),
            name: "Test Student",
            studentClass: "JSS 2B",
            schoolId: "school_1",
            createdAt: Date.now(),
          })
        }
      >
        Add Test Student
      </button>

      <div className="flex relative h-screen items-center justify-center overflow-hidden">
        {students && students.length > 0 && (
          <>
            <StudentSwipeCard
              key={currentIndex}
              students={students.slice(currentIndex)}
              onSwipe={handleSwipe}
            />

            {lastSwipe && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center gap-4 shadow-lg">
                <span className="text-sm">
                  {lastSwipe.status === "present"
                    ? "✓ Marked Present"
                    : "✗ Marked Absent"}
                </span>
                <button
                  onClick={handleUndo}
                  className="text-blue-400 hover:text-blue-300 font-semibold text-sm underline"
                >
                  Undo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
