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

export const StudentSwipeCard = ({
  students,
  onSwipe,
  onUndo,
  onSave,
  markedCount,
  totalStudents,
}: StudentSwipeCardProps) => {
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

  const advance = useCallback(
    (studentId: string, status: "present" | "absent") => {
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
    },
    [index, students.length, onSwipe],
  );

  const handleSwipe = (
    action:
      | { type: "swiping"; deltaX: number }
      | { type: "swiped-left"; studentId: string }
      | { type: "swiped-right"; studentId: string }
      | { type: "reset" },
  ) => {
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
    ? swipeDirection === "left"
      ? -1000
      : 1000
    : amplifiedDragX;
  const finalTranslateY = isAnimating ? 0 : Math.abs(amplifiedDragX) * 0.3;
  const finalOpacity = isAnimating ? 0 : dragOpacity;
  const finalRotation = isAnimating
    ? swipeDirection === "left"
      ? -45
      : 45
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
      if (
        !isAnimating &&
        Math.abs(amplifiedDragX) > 0 &&
        Math.abs(amplifiedDragX) < minSwipeDistance * 1.8 &&
        !showSummary
      ) {
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

  const presentCount = history.filter((h) => h.status === "present").length;
  const absentCount = history.filter((h) => h.status === "absent").length;

  if (showSummary) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-sm mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">All done!</h3>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          {markedCount} of {totalStudents} students marked
        </p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl py-3 px-4">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-xs text-green-600 font-medium">Present</p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-red-50 to-red-100 rounded-xl py-3 px-4">
            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            <p className="text-xs text-red-600 font-medium">Absent</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-6 max-h-48 overflow-y-auto">
          {history.map((h, i) => {
            const student = students.find((s) => s.id === h.studentId);
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    h.status === "present" ? "bg-green-500" : "bg-red-400"
                  }`}
                />
                <span className="text-gray-700 flex-1 text-left truncate">
                  {student?.name ?? "Unknown"}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    h.status === "present"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {h.status === "present" ? "P" : "A"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          {history.length > 0 && (
            <Button variant="outline" onClick={handleUndo} className="flex-1 text-sm">
              ↩ Undo Last
            </Button>
          )}
          <Button
            onClick={onSave}
            className="flex-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200"
          >
            Confirm & Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] flex items-center justify-center">
      <div className="relative w-[340px] h-[460px]">
        {nextNextStudent && (
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
            style={{
              transform: "translateY(16px) scale(0.94)",
              zIndex: 8,
              opacity: 0.3,
            }}
          />
        )}

        {nextStudent && (
          <div
            className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden"
            style={{ transform: "translateY(4px) scale(0.98)", zIndex: 9, opacity: 0.7 }}
          >
            <StudentCard student={nextStudent} />
          </div>
        )}

        <div
          {...handlers}
          className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-2xl shadow-2xl overflow-hidden"
          style={{
            transform: `translateX(${finalTranslateX}px) translateY(${finalTranslateY}px) rotate(${finalRotation}deg)`,
            opacity: finalOpacity,
            transition: isAnimating || isResetting ? "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform, opacity",
            zIndex: 10,
          }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-500/20 to-transparent pointer-events-none z-20"
            style={{ opacity: amplifiedDragX < -20 ? Math.min(0.8, Math.abs(amplifiedDragX) / 150) : 0 }}
          />

          <div
            className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-green-500/20 to-transparent pointer-events-none z-20"
            style={{ opacity: amplifiedDragX > 20 ? Math.min(0.8, amplifiedDragX / 150) : 0 }}
          />

          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-150"
            style={{
              opacity: amplifiedDragX < -30 ? Math.min(1, Math.abs(amplifiedDragX) / 100) : 0,
              transform: `translateX(${Math.min(0, amplifiedDragX * 0.1)}px)`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white drop-shadow-md">ABSENT</span>
            </div>
          </div>

          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-150"
            style={{
              opacity: amplifiedDragX > 30 ? Math.min(1, amplifiedDragX / 100) : 0,
              transform: `translateX(${Math.max(0, amplifiedDragX * 0.1)}px)`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white drop-shadow-md">PRESENT</span>
            </div>
          </div>

          <StudentCard student={currentStudent!} />
        </div>

        <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2">
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(students.length, 20) }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < index
                    ? history[i]?.status === "present"
                      ? "bg-green-400"
                      : "bg-red-400"
                    : i === index
                      ? "bg-blue-500 scale-125"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-2">
            {index + 1} / {students.length}
          </span>
        </div>

        <div className="absolute -top-8 left-0 right-0 flex justify-center gap-8 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Swipe left
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Swipe right
          </span>
        </div>
      </div>

      {showUndo && history.length > 0 && (
        <button
          onClick={handleUndo}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white border border-gray-200 rounded-full shadow-lg text-sm text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          ↩ Undo {history[history.length - 1]?.status ?? ""}
        </button>
      )}
    </div>
  );
};
