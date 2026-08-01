import { useState, useEffect, useRef } from "react";
import { TickCircle } from "iconsax-react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/button";
import type { ExamRosterStudent } from "../types";

interface StudentScoreCardProps {
  student: ExamRosterStudent;
  maxScore: number;
  value: number | null;
  saved: boolean;
  onChange: (studentId: string, value: number) => void;
  onNext: () => void;
  onSkip: () => void;
}

const padDigits = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export const StudentScoreCard = ({
  student,
  maxScore,
  value,
  saved,
  onChange,
  onNext,
  onSkip,
}: StudentScoreCardProps) => {
  const [showKeypad, setShowKeypad] = useState(true);
  const [animClass, setAnimClass] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowKeypad(true);
    setAnimClass("animate-in");
    containerRef.current?.focus({ preventScroll: true });
  }, [student.studentId]);

  const current = value ?? 0;

  const padNumber = (n: number) => {
    const next = current * 10 + n;
    if (next <= maxScore) onChange(student.studentId, next);
  };

  const padDelete = () => onChange(student.studentId, Math.floor(current / 10));

  const tap = (fn: () => void) => () => {
    fn();
    containerRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onNext();
    } else if (e.key === "Backspace") {
      padDelete();
    } else if (/^[0-9]$/.test(e.key)) {
      padNumber(Number(e.key));
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`w-full max-w-md mx-auto bg-white rounded-xl border border-gray100 p-5 sm:p-6 flex flex-col items-center gap-4 outline-none transition-all duration-300 ${
        animClass === "animate-in" ? "opacity-100 translate-y-0" : ""
      }`}
    >
      <Avatar name={student.studentName} size={64} className="bg-gray900 text-white" />
      <div className="text-center min-w-0 w-full">
        <p className="text-base font-semibold text-gray900 truncate">{student.studentName}</p>
        <p className="text-xs text-gray500 mt-0.5">{student.admissionNo}</p>
        {saved && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-springgreen600/10 px-2 py-0.5 text-[11px] font-medium text-springgreen600">
            <TickCircle size={12} variant="Bold" color="#15803D" />
            Saved
          </p>
        )}
      </div>

      <div className="w-full select-none">
        <div className="h-16 w-full rounded-full border border-gray100 bg-offWhite px-4 text-3xl font-bold text-gray900 flex items-center justify-center">
          {value === null ? <span className="text-placeholder">—</span> : value}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray500">out of {maxScore}</p>
          <p className="text-xs text-gray500">Enter to go next</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full">
        <Button onClick={tap(onNext)} className="flex-1 active:scale-95 transition-transform">
          Next
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={tap(() => setShowKeypad((v) => !v))}
          className="shrink-0 hidden sm:inline-flex active:scale-95 transition-transform"
        >
          {showKeypad ? "Hide keypad" : "Keypad"}
        </Button>
      </div>

      {showKeypad && (
        <div className="w-full grid grid-cols-3 gap-2">
          {padDigits.map((row) =>
            row.map((d) => (
              <button
                key={d}
                type="button"
                onClick={tap(() => padNumber(d))}
                className="h-14 rounded-full bg-offWhite text-xl font-semibold text-gray900 hover:bg-gray100 active:bg-gray200 active:scale-95 transition-all"
              >
                {d}
              </button>
            )),
          )}
          <button
            type="button"
            onClick={tap(padDelete)}
            className="h-14 rounded-full bg-offWhite text-lg font-semibold text-gray700 hover:bg-gray100 active:bg-gray200 active:scale-95 transition-all"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={tap(() => padNumber(0))}
            className="h-14 rounded-full bg-offWhite text-xl font-semibold text-gray900 hover:bg-gray100 active:bg-gray200 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={tap(onNext)}
            className="h-14 rounded-full bg-gray900 text-xl font-semibold text-white hover:bg-gray800 active:bg-gray700 active:scale-95 transition-all"
          >
            ✓
          </button>
        </div>
      )}

      <Button type="button" variant="ghost" onClick={onSkip} className="text-xs active:scale-95 transition-transform">
        Skip
      </Button>
    </div>
  );
};
