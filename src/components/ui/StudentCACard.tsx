import { useState, useRef, useEffect } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { spokenToNumber } from "../../utils/spokenNumber";
import type { Student } from "../../db/db";

interface StudentCACardProps {
  student: Student;
  score: number;
  maxScore: number;
  onScoreChange: (studentId: string, score: number) => void;
  onAutoAdvance: () => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const StudentCACard = ({
  student,
  score,
  maxScore,
  onScoreChange,
  onAutoAdvance,
}: StudentCACardProps) => {
  const [animClass, setAnimClass] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const { isListening, startListening, supported: voiceSupported } = useSpeechToText();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAnimClass("animate-in");
    setConfirmed(false);
    setShowNumpad(false);
    setVoiceFeedback("");
    inputRef.current?.focus();
  }, [student.id]);

  const commitScore = (value: number) => {
    const clamped = Math.max(0, Math.min(maxScore, value));
    onScoreChange(student.id, clamped);
    setConfirmed(true);
    setVoiceFeedback("");
    setTimeout(() => {
      setAnimClass("animate-out");
      setTimeout(onAutoAdvance, 300);
    }, 600);
  };

  const handleVoiceInput = () => {
    setVoiceFeedback("Listening...");
    startListening((text) => {
      const num = spokenToNumber(text);
      if (num !== null) {
        commitScore(num);
        setVoiceFeedback(`\u201C${text}\u201D \u2192 ${num}`);
      } else {
        setVoiceFeedback(`\u201C${text}\u201D \u2014 not a number, try again`);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitScore(score);
    }
  };

  const padNumber = (n: number) => {
    const next = score * 10 + n;
    if (next <= maxScore) {
      onScoreChange(student.id, next);
    }
  };

  const padDelete = () => {
    onScoreChange(student.id, Math.floor(score / 10));
  };

  const digits = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  return (
    <div
      className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center gap-5 transition-all duration-300 ${
        animClass === "animate-in"
          ? "opacity-100 translate-y-0"
          : animClass === "animate-out"
            ? "opacity-0 translate-y-8 scale-95"
            : ""
      }`}
    >
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
        {student.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(student.name)
        )}
      </div>

      <p className="text-lg font-semibold text-gray-800 text-center">
        {student.name}
      </p>

      <p className="text-sm text-gray-400">{student.studentClass}</p>

      <input
        ref={inputRef}
        type="number"
        min={0}
        max={maxScore}
        value={score}
        onChange={(e) =>
          onScoreChange(student.id, Math.min(maxScore, Math.max(0, Number(e.target.value))))
        }
        onKeyDown={handleKeyDown}
        readOnly={confirmed}
        className="w-full h-14 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-3xl text-center font-bold text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        placeholder="—"
        autoFocus
      />

      <div className="flex items-center gap-3">
        {voiceSupported ? (
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isListening || confirmed}
            className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl transition-all shadow-md ${
              isListening
                ? "bg-red-500 text-white scale-110 shadow-lg animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
            title="Speak score"
          >
            {isListening ? "..." : "🎤"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowNumpad(true)}
            disabled={confirmed}
            className="h-10 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            Open keypad
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowNumpad(!showNumpad)}
          disabled={confirmed}
          className="h-10 px-4 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30"
        >
          {showNumpad ? "Hide keypad" : "Keypad"}
        </button>
      </div>

      {voiceFeedback && (
        <p className="text-xs text-gray-500 text-center">{voiceFeedback}</p>
      )}

      {showNumpad && (
        <div className="w-full animate-in transition-all">
          <div className="grid grid-cols-3 gap-2">
            {digits.map((row) =>
              row.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => padNumber(d)}
                  disabled={confirmed}
                  className="h-12 rounded-xl bg-gray-100 text-lg font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-30"
                >
                  {d}
                </button>
              )),
            )}
            <button
              type="button"
              onClick={padDelete}
              disabled={confirmed || score === 0}
              className="h-12 rounded-xl bg-gray-100 text-lg font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-30"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => padNumber(0)}
              disabled={confirmed}
              className="h-12 rounded-xl bg-gray-100 text-lg font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-30"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => commitScore(score)}
              disabled={confirmed}
              className="h-12 rounded-xl bg-blue-600 text-lg font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-30"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      {confirmed ? (
        <p className="text-sm text-green-600 font-medium">
          {score} saved &mdash; moving to next...
        </p>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          {!voiceSupported
            ? "Voice requires HTTPS — use the keypad or type"
            : showNumpad
              ? "Tap digits then ✓, or use the mic"
              : "Tap the mic and speak, or open keypad"}{" "}
          &middot; Type + Enter works too
        </p>
      )}
    </div>
  );
};
