import { useState, useMemo } from "react";
import { ArrowLeft2, ArrowRight2, Add, SearchNormal, DocumentText, Lock1, Book1 } from "iconsax-react";

import { useActiveTerm } from "../../calendar/api/useActiveTerm";
import { useExams } from "../api/useExams";
import { useExamScores } from "../api/useExamScores";
import { useSaveExamStudentScore } from "../api/useSaveExamStudentScore";
import { CreateAssessmentDialog } from "./CreateAssessmentDialog";
import { StudentScoreCard } from "./StudentScoreCard";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import type { Exam } from "../types";

const statusPill = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray100 text-gray700";
    case "PUBLISHED":
      return "bg-amber500/10 text-amber500";
    case "COMPLETED":
      return "bg-springgreen600/10 text-springgreen600";
    default:
      return "bg-gray100 text-gray700";
  }
};

export const Scoring = ({ teacherMode = false }: { teacherMode?: boolean }) => {
  const { activeTerm } = useActiveTerm();
  const term = activeTerm?.term ?? "";

  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [classSubjectId, setClassSubjectId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const { data: examsData, isLoading: examsLoading } = useExams({
    term,
    classId: selectedClass?.id,
    subjectId: classSubjectId || undefined,
    limit: 500,
  });

  const exams = examsData?.exams ?? [];

  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? null;

  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(0);
  const [savedThisSession, setSavedThisSession] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});

  const { data: rosterData, isLoading: rosterLoading } = useExamScores(selectedExamId ?? "");
  const saveMutation = useSaveExamStudentScore(selectedExamId ?? "");

  const roster = rosterData?.roster ?? [];
  const isLocked = rosterData ? rosterData.status !== "DRAFT" : false;

  const classGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; assessments: number; subjects: Set<string>; scoreTotal: number }>();
    exams.forEach((e) => {
      const entry = map.get(e.classId) ?? {
        id: e.classId,
        name: e.className,
        assessments: 0,
        subjects: new Set<string>(),
        scoreTotal: 0,
      };
      entry.assessments += 1;
      entry.subjects.add(e.subjectId);
      entry.scoreTotal += e.scoreCount ?? 0;
      map.set(e.classId, entry);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [exams]);

  const subjectGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; exams: Exam[] }>();
    exams.forEach((e) => {
      const entry = map.get(e.subjectId) ?? { id: e.subjectId, name: e.subjectName, exams: [] };
      entry.exams.push(e);
      map.set(e.subjectId, entry);
    });
    return [...map.values()].map((g) => ({ ...g, exams: [...g.exams].sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [exams]);

  const classSubjectOptions = useMemo(
    () => subjectGroups.map((g) => ({ value: g.id, label: g.name })),
    [subjectGroups],
  );

  const pending = useMemo(() => {
    return roster.filter(
      (s) => s.score === null && !savedThisSession.has(s.studentId) && scores[s.studentId] === undefined,
    );
  }, [roster, savedThisSession, scores]);

  const searchMatch = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return (
      roster.find((s) => s.studentName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q)) ?? null
    );
  }, [search, roster]);

  const effectiveIndex = searchMatch ? roster.findIndex((s) => s.studentId === searchMatch.studentId) : index;
  const current = roster[effectiveIndex] ?? null;
  const isCurrentSaved = current
    ? current.score !== null || savedThisSession.has(current.studentId) || scores[current.studentId] !== undefined
    : false;

  const remaining = pending.length;

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setIndex(0);
    setSearch("");
    setSavedThisSession(new Set());
    setScores({});
  };

  const commit = (studentId: string) => {
    const val = scores[studentId];
    if (val === undefined) return;
    saveMutation.mutate(
      { studentId, data: { score: val } },
      {
        onSuccess: () => {
          setSavedThisSession((prev) => new Set(prev).add(studentId));
        },
      },
    );
  };

  const handleNext = () => {
    if (current) commit(current.studentId);
    const nextUnsaved = roster.find(
      (s) => s.score === null && !savedThisSession.has(s.studentId) && scores[s.studentId] === undefined,
    );
    if (nextUnsaved) {
      setIndex(roster.findIndex((s) => s.studentId === nextUnsaved.studentId));
    } else {
      setIndex((i) => Math.min(i + 1, Math.max(roster.length - 1, 0)));
    }
  };

  const handleSkip = () => {
    if (index < roster.length - 1) setIndex(index + 1);
  };

  const handlePrev = () => {
    if (current) commit(current.studentId);
    setIndex((i) => Math.max(i - 1, 0));
  };

  const backToExams = () => {
    setSelectedExamId(null);
    setSearch("");
  };

  const backToClasses = () => {
    setSelectedClass(null);
    setClassSubjectId("");
  };

  if (selectedExam) {
    const savedCount = roster.filter(
      (s) => s.score !== null || savedThisSession.has(s.studentId) || scores[s.studentId] !== undefined,
    ).length;

    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full shrink-0"
            onClick={backToExams}
            aria-label="Back"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#0D0D0D" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray900 truncate">{selectedExam.name}</h1>
            <p className="text-xs md:text-sm text-gray500 mt-0.5 truncate">
              {selectedExam.subjectName} · {selectedExam.className}
            </p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl border border-gray100 p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-[10px] text-gray500 font-medium uppercase tracking-wide">Max score</p>
            <p className="text-sm font-semibold text-gray900">{selectedExam.maxScore}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray500 font-medium uppercase tracking-wide">Date</p>
            <p className="text-sm font-semibold text-gray900">{selectedExam.date}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray500 font-medium uppercase tracking-wide">Progress</p>
            <p className="text-sm font-semibold text-gray900">{savedCount} / {roster.length}</p>
          </div>
          <span className={cn("ml-auto rounded-full px-3 py-1 text-[11px] font-medium", statusPill(selectedExam.status))}>
            {selectedExam.status}
          </span>
        </div>

        {isLocked && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-3">
            <Lock1 size={16} variant="Bold" color="#F59E0B" className="shrink-0" />
            <p className="text-sm text-gray700">
              Scores are locked once an assessment is published. Only admins can change the status.
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="relative max-w-sm">
            <SearchNormal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" variant="Bold" color="#B3B3B3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or admission no."
              className="w-full h-[45px] rounded-full border border-gray100 bg-white pl-11 pr-4 text-sm text-gray900 placeholder:text-gray400 focus:outline-none focus:border-gray900 transition-colors"
            />
          </div>
        </div>

        <div className="mt-6">
          {rosterLoading ? (
            <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
            </div>
          ) : !current ? (
            <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
              <DocumentText size={24} className="mx-auto text-gray300 mb-2" />
              <p className="text-sm font-medium text-gray900">
                {search ? "No student matches your search" : "No students in this class"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between max-w-md mx-auto mb-4">
                <p className="text-xs text-gray500">
                  {remaining > 0 ? `${remaining} remaining` : "All students scored"}
                </p>
                {searchMatch && (
                  <p className="text-xs text-gray500">Jumped to search result</p>
                )}
              </div>
              <StudentScoreCard
                key={current.studentId}
                student={current}
                maxScore={selectedExam.maxScore}
                value={scores[current.studentId] ?? current.score ?? null}
                saved={isCurrentSaved}
                onChange={(studentId, value) => setScores((prev) => ({ ...prev, [studentId]: value }))}
                onNext={handleNext}
                onPrev={handlePrev}
                onSkip={handleSkip}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full shrink-0"
            onClick={backToClasses}
            aria-label="Back to classes"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#0D0D0D" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-gray900 truncate">{selectedClass.name}</h1>
            <p className="text-xs md:text-sm text-gray500 mt-0.5 truncate">
              Assessments for this class
            </p>
          </div>
          {!teacherMode && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Add size={14} variant="Linear" color="#FFFFFF" />
              New assessment
            </Button>
          )}
        </div>

        <div className="mt-4">
          <SelectDropdown
            options={classSubjectOptions}
            value={classSubjectId}
            onChange={setClassSubjectId}
            placeholder="All subjects"
            buttonClassName="w-full sm:w-56"
            searchable
          />
        </div>

        <div className="mt-6 space-y-6">
          {examsLoading ? (
            <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
            </div>
          ) : subjectGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
              <DocumentText size={24} className="mx-auto text-gray300 mb-2" />
              <p className="text-sm font-medium text-gray900">No assessments yet</p>
              <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
                {teacherMode
                  ? "No assessments assigned to you yet. Check back once your subject assessments are created."
                  : "Create an assessment to start recording CA and exam scores."}
              </p>
            </div>
          ) : (
            subjectGroups.map((g) => (
              <section key={g.id}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray900">
                  <Book1 size={16} variant="Bold" color="#0D0D0D" />
                  {g.name}
                </h2>
                <div className="space-y-2">
                  {g.exams.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => handleSelectExam(e.id)}
                      className="w-full bg-white rounded-xl border border-gray100 p-4 flex items-center gap-3 text-left hover:border-gray200 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray100">
                        <DocumentText size={18} variant="Bold" color="#0D0D0D" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray900 truncate">{e.name}</p>
                        <p className="text-xs text-gray500 mt-0.5 truncate">
                          {e.componentName ?? e.type} · {e.date}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", statusPill(e.status))}>
                          {e.status}
                        </span>
                        <span className="text-[11px] text-gray500">{e.scoreCount} scored</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {!teacherMode && (
          <CreateAssessmentDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            defaultClassId={selectedClass.id}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Scoring</h1>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            Pick a class to record scores per student.
          </p>
        </div>
        {!teacherMode && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Add size={14} variant="Linear" color="#FFFFFF" />
            New assessment
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {examsLoading ? (
          <div className="bg-white rounded-xl border border-gray100 p-8 text-center sm:col-span-2 xl:col-span-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
          </div>
        ) : classGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray100 p-8 text-center sm:col-span-2 xl:col-span-3">
            <DocumentText size={24} className="mx-auto text-gray300 mb-2" />
            <p className="text-sm font-medium text-gray900">No assessments yet</p>
            <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
              {teacherMode
                ? "No assessments assigned to you yet. Check back once your subject assessments are created."
                : "Create an assessment to start recording CA and exam scores."}
            </p>
          </div>
        ) : (
          classGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedClass({ id: g.id, name: g.name })}
              className="group w-full bg-white rounded-xl border border-gray100 p-4 text-left hover:border-gray200 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray900 truncate">{g.name}</p>
                <ArrowRight2
                  size={16}
                  variant="Bold"
                  color="#B3B3B3"
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <p className="mt-2 text-xs text-gray500">
                {g.assessments} {g.assessments === 1 ? "assessment" : "assessments"} · {g.subjects.size}{" "}
                {g.subjects.size === 1 ? "subject" : "subjects"} · {g.scoreTotal} scored
              </p>
            </button>
          ))
        )}
      </div>

      {!teacherMode && (
        <CreateAssessmentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultClassId={undefined}
        />
      )}
    </div>
  );
};
