import { useSwipeable } from "react-swipeable";
import { useState, useCallback, useEffect } from "react";

import { StudentCard } from "./StudentCard";
import { Button } from "./button";
import type { Student } from "../../features/students/types";

interface SwipeRecord {
  studentId: string;
  status: "present" | "absent";
}

interface StudentSwipeCardProps {
  students: Student[];
  onSwipe: (studentId: string, status: "present" | "absent") => void;
  onUndo: (studentId: string) => void;
  onSave: () => void;
  markedCount: number;
  totalStudents: number;
}

export const StudentSwipeCard = ({ students, onSwipe, onUndo, onSave, markedCount, totalStudents }: StudentSwipeCardProps) => {
  const [dragX, setDragX] = useState(0);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [history, setHistory] = useState<SwipeRecord[]>([]);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (showUndo) {
      const t = setTimeout(() => setShowUndo(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showUndo]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    onUndo(last.studentId);
    setIndex((prev) => Math.max(0, prev - 1));
    setShowUndo(false);
    setShowSummary(false);
  }, [history, onUndo]);

  const advance = useCallback((studentId: string, status: "present" | "absent") => {
    onSwipe(studentId, status);
    setHistory((prev) => [...prev, { studentId, status }]);
    setDragX(0);

    if (index + 1 >= students.length) {
      setIsAnimating(true);
      setSwipeDirection(status === "absent" ? "left" : "right");
      setTimeout(() => {
        setIsAnimating(false);
        setSwipeDirection(null);
        setShowSummary(true);
      }, 400);
    } else {
      setIsAnimating(true);
      setSwipeDirection(status === "absent" ? "left" : "right");
      setTimeout(() => {
        setIndex((prev) => prev + 1);
        setIsAnimating(false);
        setSwipeDirection(null);
        setShowUndo(true);
      }, 400);
    }
  }, [index, students.length, onSwipe]);

  const handleSwipe = (action: { type: "swiping"; deltaX: number } | { type: "swiped-left"; studentId: string } | { type: "swiped-right"; studentId: string } | { type: "reset" }) => {
    if (action.type === "swiping") {
      setDragX(action.deltaX);
    } else if (action.type === "swiped-left") {
      advance(action.studentId, "absent");
    } else if (action.type === "swiped-right") {
      advance(action.studentId, "present");
    } else if (action.type === "reset") {
      setIsResetting(true);
      setDragX(0);
      setTimeout(() => setIsResetting(false), 300);
    }
  };

  const currentStudent = showSummary ? undefined : students[index];
  const nextStudent = showSummary ? undefined : students[index + 1];
  const nextNextStudent = showSummary ? undefined : students[index + 2];

  const amplifiedDragX = dragX * 1.8;
  const cardRotation = amplifiedDragX * 0.02;
  const dragOpacity = Math.max(0, 1 - Math.abs(amplifiedDragX) / 500);
  const minSwipeDistance = 250;

  const finalTranslateX = isAnimating
    ? swipeDirection === "left" ? -1000 : 1000
    : amplifiedDragX;
  const finalTranslateY = isAnimating ? 0 : Math.abs(amplifiedDragX) * 0.3;
  const finalOpacity = isAnimating ? 0 : dragOpacity;
  const finalRotation = isAnimating
    ? swipeDirection === "left" ? -45 : 45
    : cardRotation;

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (!isAnimating && !isResetting && !showSummary) {
        handleSwipe({ type: "swiping", deltaX: e.deltaX });
      }
    },
    onSwipedLeft: () => {
      if (!isAnimating && Math.abs(amplifiedDragX) >= minSwipeDistance && !showSummary) {
        handleSwipe({ type: "swiped-left", studentId: currentStudent?.id ?? "" });
      } else if (!isAnimating && Math.abs(amplifiedDragX) < minSwipeDistance && !showSummary) {
        handleSwipe({ type: "reset" });
      }
    },
    onSwipedRight: () => {
      if (!isAnimating && amplifiedDragX >= minSwipeDistance && !showSummary) {
        handleSwipe({ type: "swiped-right", studentId: currentStudent?.id ?? "" });
      } else if (!isAnimating && amplifiedDragX < minSwipeDistance && !showSummary) {
        handleSwipe({ type: "reset" });
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (!isAnimating && Math.abs(amplifiedDragX) > 0 && Math.abs(amplifiedDragX) < minSwipeDistance * 1.8 && !showSummary) {
        handleSwipe({ type: "reset" });
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 2,
  });

  if (!students || students.length === 0) {
    return <div className="text-center text-gray-400 py-8">No students</div>;
  }

  if (showSummary) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm mx-auto text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance Complete!</h3>
        <p className="text-sm text-gray-400 mb-6">{markedCount} of {totalStudents} students marked</p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-xl">
            <span className="text-sm font-medium text-green-700">Present</span>
            <span className="text-lg font-bold text-green-700">{markedCount}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-red-50 rounded-xl">
            <span className="text-sm font-medium text-red-700">Absent</span>
            <span className="text-lg font-bold text-red-700">{totalStudents - markedCount}</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {history.map((h, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-700">{students.find((s) => s.id === h.studentId)?.name ?? h.studentId}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {h.status}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUndo} className="flex-1">
            Undo Last
          </Button>
          <Button onClick={onSave} className="flex-1">
            Confirm & Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      <div className="relative w-[500px] h-[500px]">
        {nextNextStudent && (
          <div
            style={{
              transform: "translateY(12px) scale(0.96)",
              zIndex: 8,
              opacity: 0.4,
            }}
            className="absolute w-full h-full rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="w-full h-full bg-blue-500" />
          </div>
        )}

        {nextStudent && (
          <div
            style={{ transform: "translateY(0) scale(1)", zIndex: 9, opacity: 1 }}
            className="absolute w-full h-full rounded-2xl shadow-xl overflow-hidden"
          >
            <StudentCard student={nextStudent} />
          </div>
        )}

        <div
          {...handlers}
          style={{
            transform: `translateX(${finalTranslateX}px) translateY(${finalTranslateY}px) rotate(${finalRotation}deg)`,
            opacity: finalOpacity,
            transition: isAnimating || isResetting ? "all 0.3s ease-out" : "none",
            willChange: "transform, opacity",
            zIndex: 10,
          }}
          className="absolute w-full h-full cursor-grab active:cursor-grabbing rounded-2xl shadow-xl overflow-hidden"
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-6xl pointer-events-none"
            style={{
              opacity: amplifiedDragX < -30 ? Math.min(1, Math.abs(amplifiedDragX) / 100) : 0,
            }}
          >
            ABSENT
          </div>

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 font-bold text-6xl pointer-events-none"
            style={{
              opacity: amplifiedDragX > 30 ? Math.min(1, amplifiedDragX / 100) : 0,
            }}
          >
            PRESENT
          </div>

          <StudentCard student={currentStudent!} />
        </div>

        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-xs text-gray-400">
            {index + 1} of {students.length}
          </span>
        </div>
      </div>

      {showUndo && history.length > 0 && (
        <button
          onClick={handleUndo}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-lg text-sm text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          ↩ Undo last
        </button>
      )}
    </div>
  );
};
