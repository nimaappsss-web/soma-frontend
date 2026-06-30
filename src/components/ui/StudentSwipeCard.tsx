import { useSwipeable } from "react-swipeable";
import { useState } from "react";

import { StudentCard } from "./StudentCard";
import type { Student } from "../../db/db";

type SwipeAction =
  | { type: "swiping"; deltaX: number }
  | { type: "swiped-left"; studentId: string }
  | { type: "swiped-right"; studentId: string }
  | { type: "reset" };

interface StudentSwipeCardProps {
  students: Student[];
  onSwipe: (studentId: string, status: "present" | "absent") => void;
}

export const StudentSwipeCard = ({ students, onSwipe }: StudentSwipeCardProps) => {
  const [dragX, setDragX] = useState(0);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSwipe = (action: SwipeAction) => {
    if (action.type === "swiping") {
      setDragX(action.deltaX);
    } else if (action.type === "swiped-left") {
      onSwipe(action.studentId, "absent");
      setDragX(0);
      setSwipeDirection("left");
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => prev + 1);
        setIsAnimating(false);
        setSwipeDirection(null);
      }, 400);
    } else if (action.type === "swiped-right") {
      onSwipe(action.studentId, "present");
      setDragX(0);
      setSwipeDirection("right");
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => prev + 1);
        setIsAnimating(false);
        setSwipeDirection(null);
      }, 400);
    } else if (action.type === "reset") {
      setIsResetting(true);
      setDragX(0);
      setTimeout(() => {
        setIsResetting(false);
      }, 300);
    }
  };

  if (!students || students.length === 0) {
    return <div className="text-center text-gray-400">No students</div>;
  }

  if (index >= students.length) {
    return <div className="text-center text-gray-400">All done!</div>;
  }

  const currentStudent = students[index];
  const nextStudent = students[index + 1];
  const nextNextStudent = students[index + 2];

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
      if (!isAnimating && !isResetting) {
        handleSwipe({ type: "swiping", deltaX: e.deltaX });
      }
    },
    onSwipedLeft: () => {
      if (!isAnimating && Math.abs(amplifiedDragX) >= minSwipeDistance) {
        handleSwipe({ type: "swiped-left", studentId: currentStudent.id });
      } else if (!isAnimating && Math.abs(amplifiedDragX) < minSwipeDistance) {
        handleSwipe({ type: "reset" });
      }
    },
    onSwipedRight: () => {
      if (!isAnimating && amplifiedDragX >= minSwipeDistance) {
        handleSwipe({ type: "swiped-right", studentId: currentStudent.id });
      } else if (!isAnimating && amplifiedDragX < minSwipeDistance) {
        handleSwipe({ type: "reset" });
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (
        !isAnimating &&
        Math.abs(amplifiedDragX) > 0 &&
        Math.abs(amplifiedDragX) < minSwipeDistance * 1.8
      ) {
        handleSwipe({ type: "reset" });
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 2,
  });

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
          className="absolute w-full h-full cursor-grab active:cursor-grabbing"
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-6xl pointer-events-none"
            style={{
              opacity: amplifiedDragX < -30
                ? Math.min(1, Math.abs(amplifiedDragX) / 100)
                : 0,
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

          <StudentCard student={currentStudent} />
        </div>
      </div>
    </div>
  );
};
