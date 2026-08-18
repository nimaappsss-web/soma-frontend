import { useSwipeable } from "react-swipeable";
import { useState, useCallback, useEffect } from "react";
import { CloseCircle, RotateLeft, TickCircle } from "iconsax-react";

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
  note?: string;
  onNoteChange?: (note: string) => void;
}

export const StudentSwipeCard = ({
  students,
  onSwipe,
  onUndo,
  onSave,
  markedCount,
  totalStudents,
  note = "",
  onNoteChange,
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
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 max-w-sm mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-[#E9F7EE] flex items-center justify-center mx-auto mb-4">
          <TickCircle size={32} color="#34A853" variant="Bold" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">All done!</h3>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          {markedCount} of {totalStudents} students marked
        </p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-[#E9F7EE] rounded-2xl py-3 px-4">
            <div className="flex items-center justify-center gap-1.5">
              <TickCircle size={14} color="#34A853" variant="Bold" />
              <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Present</p>
          </div>
          <div className="flex-1 bg-[#FFF0ED] rounded-2xl py-3 px-4">
            <div className="flex items-center justify-center gap-1.5">
              <CloseCircle size={14} color="#CD432F" variant="Bold" />
              <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Absent</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-6 max-h-48 overflow-y-auto">
          {history.map((h, i) => {
            const student = students.find((s) => s.id === h.studentId);
            const isPresent = h.status === "present";
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl text-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-100 text-xs font-semibold text-gray-500 shrink-0">
                  {student?.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <span className="text-gray-700 flex-1 text-left truncate">
                  {student?.name ?? "Unknown"}
                </span>
                {isPresent ? (
                  <TickCircle size={18} color="#34A853" variant="Bold" />
                ) : (
                  <CloseCircle size={18} color="#CD432F" variant="Bold" />
                )}
              </div>
            );
          })}
        </div>

        {onNoteChange && (
          <div className="mb-4">
            <input
              type="text"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full h-[38px] rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        )}

        <div className="flex gap-2">
          {history.length > 0 && (
            <Button variant="outline" onClick={handleUndo} className="flex-1 text-sm gap-1.5">
              <RotateLeft size={14} color="#0D0D0D" />
              Undo Last
            </Button>
          )}
          <Button onClick={onSave} className="flex-1 text-sm gap-1.5">
            Confirm & Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center select-none">
      {/* Progress bar at the top */}
      <div className="flex w-full flex-col items-center gap-2 px-4 pb-4 pt-1">
        <div className="flex w-[340px] items-center gap-1.5">
          {students.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < index
                  ? history[i]?.status === "present"
                    ? "bg-springgreen600"
                    : "bg-red500"
                  : i === index
                    ? "bg-gray-900"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex w-[340px] items-center justify-between">
          <span className="text-xs text-gray-400 tabular-nums">
            {index + 1} / {students.length}
          </span>
          {showUndo && history.length > 0 && (
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <RotateLeft size={13} color="#8C8C8C" />
              Undo {history[history.length - 1]?.status === "present" ? "Present" : "Absent"}
            </button>
          )}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-[340px] h-[460px]">
        {nextNextStudent && (
          <div
            className="absolute inset-0 rounded-tl-2xl rounded-tr-[48px] rounded-br-2xl rounded-bl-[48px] overflow-hidden select-none bg-gradient-to-br from-gray-200 to-gray-300"
            style={{
              transform: "translateY(16px) scale(0.94)",
              zIndex: 8,
              opacity: 0.3,
            }}
          />
        )}

        {nextStudent && (
          <div
            className="absolute inset-0 rounded-tl-2xl rounded-tr-[48px] rounded-br-2xl rounded-bl-[48px] shadow-xl overflow-hidden select-none"
            style={{ transform: "translateY(4px) scale(0.98)", zIndex: 9, opacity: 0.7 }}
          >
            <StudentCard student={nextStudent} />
          </div>
        )}

        <div
          {...handlers}
          className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-tl-2xl rounded-tr-[48px] rounded-br-2xl rounded-bl-[48px] shadow-2xl overflow-hidden"
          style={{
            transform: `translateX(${finalTranslateX}px) translateY(${finalTranslateY}px) rotate(${finalRotation}deg)`,
            opacity: finalOpacity,
            transition: isAnimating || isResetting ? "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform, opacity",
            zIndex: 10,
          }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-500/40 to-transparent pointer-events-none z-20"
            style={{ opacity: amplifiedDragX < -20 ? Math.min(0.95, Math.abs(amplifiedDragX) / 130) : 0 }}
          />

          <div
            className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-green-500/40 to-transparent pointer-events-none z-20"
            style={{ opacity: amplifiedDragX > 20 ? Math.min(0.95, amplifiedDragX / 130) : 0 }}
          />

          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-150"
            style={{
              opacity: amplifiedDragX < -30 ? Math.min(1, Math.abs(amplifiedDragX) / 80) : 0,
              transform: `translateX(${Math.min(0, amplifiedDragX * 0.1)}px)`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                <CloseCircle size={20} color="#CD432F" variant="Bold" />
              </div>
              <span className="text-xs font-bold text-white drop-shadow-md">ABSENT</span>
            </div>
          </div>

          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-150"
            style={{
              opacity: amplifiedDragX > 30 ? Math.min(1, amplifiedDragX / 80) : 0,
              transform: `translateX(${Math.max(0, amplifiedDragX * 0.1)}px)`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                <TickCircle size={20} color="#34A853" variant="Bold" />
              </div>
              <span className="text-xs font-bold text-white drop-shadow-md">PRESENT</span>
            </div>
          </div>

          <StudentCard student={currentStudent!} />
        </div>
      </div>

      {/* Circular action buttons at the bottom */}
      <div className="flex items-center justify-center gap-4 pt-5">
        <button
          type="button"
          onClick={() => advance(currentStudent!.id, "absent")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#FFF0ED] bg-[#FFF0ED] text-red500 shadow-sm transition-transform active:scale-95"
        >
          <CloseCircle size={26} color="#CD432F" variant="Bold" />
        </button>
        <button
          type="button"
          onClick={() => advance(currentStudent!.id, "present")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E9F7EE] bg-[#E9F7EE] text-springgreen600 shadow-sm transition-transform active:scale-95"
        >
          <TickCircle size={26} color="#34A853" variant="Bold" />
        </button>
      </div>
    </div>
  );
};
