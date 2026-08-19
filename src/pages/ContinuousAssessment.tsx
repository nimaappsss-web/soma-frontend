import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "@/utils/toast";
import { ArrowLeft2, Profile2User } from "iconsax-react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../db/db";
import { StudentCACard } from "../components/ui/StudentCACard";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/input";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { useActiveTerm } from "../features/calendar/api";
const ASSESSMENT_TYPES = ["Quiz", "Test", "Assignment", "Project", "Exam"];
export const ContinuousAssessment = () => {
  const { user } = useAuth();
  const { activeTerm } = useActiveTerm();
  const userId = user?.id ?? "";
  const students = useLiveQuery(
    () => {
      if (!userId) return [];
      return db.students.where("userId").equals(userId).toArray();
    },
    [userId],
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [assessmentType, setAssessmentType] = useState(ASSESSMENT_TYPES[0]);
  const [maxScore, setMaxScore] = useState(30);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const classes = [...new Set(students?.map((s) => s.classId) ?? [])];
  const filtered = selectedClass
    ? students?.filter((s) => s.classId === selectedClass) ?? []
    : students ?? [];
  const current = filtered[index];
  const isComplete = index >= filtered.length;
  const handleScoreChange = (studentId: string, score: number) => {
    setScores((prev) => ({ ...prev, [studentId]: score }));
  };
  const handleAutoAdvance = () => {
    setIndex((prev) => Math.min(prev + 1, filtered.length));
  };
  const handlePrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };
  const handleNext = () => {
    setIndex((prev) => Math.min(prev + 1, filtered.length));
  };
  const handleSave = async () => {
    if (!activeTerm) {
      toast.error("No active term — set up terms first");
      return;
    }
    const term = activeTerm.term;
    const session = `${new Date(activeTerm.startDate).getFullYear()}/${new Date(activeTerm.startDate).getFullYear() + 1}`;
    const entries = Object.entries(scores).map(([studentId, score]) => ({
      id: `${studentId}_${session}_${term}_${assessmentType}_${Date.now()}`,
      userId,
      studentId,
      className: selectedClass,
      schoolId: "school_1",
      score,
      maxScore,
      assessmentType,
      term,
      session,
      syncStatus: "pending" as const,
      createdAt: Date.now(),
    }));
    await db.caScores.bulkPut(entries);
    setSavedCount((prev) => prev + entries.length);
    setScores({});
    setIndex(0);
  };
  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Continuous Assessment</h1>
        <a
          href="/dashboard"
          aria-label="Back to Dashboard"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </a>
      </header>
      <div className="flex flex-wrap gap-3 px-6 py-4 items-end border-b border-gray-100 bg-white">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Class</label>
          <SelectDropdown
            placeholder="All classes"
            options={classes.map((c) => ({ value: c, label: c }))}
            value={selectedClass}
            onChange={(v) => {
              setSelectedClass(v);
              setIndex(0);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Type</label>
          <SelectDropdown
            options={ASSESSMENT_TYPES.map((t) => ({ value: t, label: t }))}
            value={assessmentType}
            onChange={setAssessmentType}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Max Score</label>
          <Input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
            className="h-9 w-20 px-3"
            min={1}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={Object.keys(scores).length === 0}
          className="h-9 px-4 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          Save {Object.keys(scores).length > 0 ? `(${Object.keys(scores).length})` : ""}
        </button>
        {savedCount > 0 && (
          <span className="text-xs text-green-600">
            Last save: {savedCount} score{savedCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {filtered.length === 0 ? (
          <EmptyState
            className="min-h-[320px]"
            icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
            title={students?.length === 0 ? "No students yet" : "No students match this class"}
            description={
              students?.length === 0
                ? "Students added to this class will appear here for scoring."
                : "Try a different class filter."
            }
          />
        ) : isComplete ? (
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-4">
              All done! ({filtered.length} student{filtered.length > 1 ? "s" : ""})
            </p>
            <button
              onClick={() => setIndex(0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Review
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <p className="text-center text-sm text-gray-400 mb-4">
              {index + 1} / {filtered.length}
            </p>
            <StudentCACard
              key={current.id}
              student={current}
              score={scores[current.id] ?? 0}
              maxScore={maxScore}
              onScoreChange={handleScoreChange}
              onAutoAdvance={handleAutoAdvance}
            />
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={handlePrev}
                disabled={index === 0}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                &larr; Previous
              </button>
              <button
                onClick={handleNext}
                disabled={index >= filtered.length - 1}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
